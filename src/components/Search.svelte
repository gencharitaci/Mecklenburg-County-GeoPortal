<script>
import AutoComplete from './Autocomplete.svelte'
import { location } from '../store.js'
import jsonToURL from '../js/jsonToURL.js'

let items = []
let nomatch = false
let spinner = false

let minChar = 4;

// street suffixes and directionals the county's address search stores in
// abbreviated form (e.g. "AV" not "AVE"), so a full-text prefix match on
// the user's word fails ("AVE:*" cannot match the shorter stored "AV").
// Strip these tokens before building the tsquery so full addresses still 
// match on house number + street name.
const STRIP_WORDS = new Set([
  'AVE', 'AVENUE', 'ST', 'STREET', 'RD', 'ROAD', 'DR', 'DRIVE', 'LN', 'LANE',
  'CT', 'COURT', 'BLVD', 'BOULEVARD', 'WY', 'WAY', 'PL', 'PLACE', 'CIR',
  'CIRCLE', 'TRL', 'TRAIL', 'PKWY', 'PARKWAY', 'HWY', 'HIGHWAY', 'LOOP',
  'TER', 'TERRACE', 'XING', 'CROSSING', 'PASS', 'ROW', 'SQ', 'SQUARE',
  'WALK', 'PATH', 'ALY', 'ALLEY', 'BND', 'BEND', 'CV', 'COVE', 'GLN',
  'GLEN', 'GRV', 'GROVE', 'HL', 'HILL', 'HOLW', 'HOLLOW', 'KNL', 'KNOLL',
  'MDW', 'MEADOW', 'MDWS', 'MEADOWS', 'RDG', 'RIDGE', 'VLY', 'VALLEY',
  'VW', 'VIEW', 'N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW', 'NORTH',
  'SOUTH', 'EAST', 'WEST'
])

// build the tsquery token string, dropping street suffix/directional
// words that won't prefix-match the county's abbreviated storage. Falls
// back to the unfiltered words if stripping would remove everything.
function addressTsQuery(queryString) {
  const words = queryString.toUpperCase().trim().split(/\s+/)
  const stripped = words.filter(word => !STRIP_WORDS.has(word))
  const tokens = stripped.length > 0 ? stripped : words
  return tokens.join('&') + ':*'
}

// set store to selected value
function handleHit(event) {
  location.set({
    label: event.detail.value,
    address: event.detail.address,
    lnglat: [Number(event.detail.lng), Number(event.detail.lat)],
    pid: event.detail.pid,
    groundpid: event.detail.groundpid
  })
}

// fetch suggestions
async function handleQuery(event) {
  const queryString = event.detail.trim()
  const urls = []

  // address
  const addressArg = {
    columns: "full_address as value, 'ADDRESS' as type, groundpid, round(ST_X(ST_Transform(shape, 4326))::NUMERIC,4) as lng, round(ST_Y(ST_Transform(shape, 4326))::NUMERIC,4) as lat, num_parent_parcel as pid, full_address as address",
    limit: 8,
    filter: `ts @@ to_tsquery('addressing_en', '${addressTsQuery(queryString)}') and cde_status='A' and shape is not null`
  }
  urls.push(`https://maps.mecklenburgcountync.gov/dirt/api/v1/query/master_address_table?${jsonToURL(addressArg)}`)

  // parks
  const parkArg = {
    columns: `prkname as value, 'PARK' as type, round(ST_X(ST_Transform(p.the_geom, 4326))::NUMERIC,4) as lng, round(ST_Y(ST_Transform(p.the_geom, 4326))::NUMERIC,4) as lat, t.pid as pid, prkaddr as address`,
    limit: 5,
    filter: `prkname ilike '%${queryString}%' and p.the_geom && t.the_geom`
  }
  urls.push(`https://maps.mecklenburgcountync.gov/dirt/api/v1/query/parks p, tax_parcels t?${jsonToURL(parkArg)}`)

  // libraries
  const libraryArg = {
    columns: `name as value, 'LIBRARY' as type, round(ST_X(ST_Transform(l.the_geom, 4326))::NUMERIC,4) as lng, round(ST_Y(ST_Transform(l.the_geom, 4326))::NUMERIC,4) as lat, p.pid as pid, address`,
    limit: 5,
    filter: `name ilike '%${queryString}%' and l.the_geom && p.the_geom`
  }
  urls.push(`https://maps.mecklenburgcountync.gov/dirt/api/v1/query/libraries l, tax_parcels p?${jsonToURL(libraryArg)}`)

  // pid
  if (!isNaN(queryString) && queryString.length >= 7) {
    const pidArg = {
      columns: `num_parent_parcel as value, 'PARCEL' as type, groundpid, round(ST_X(ST_Transform(shape, 4326))::NUMERIC,4) as lng, round(ST_Y(ST_Transform(shape, 4326))::NUMERIC,4) as lat, num_parent_parcel as pid, full_address as address`,
      limit: 5,
      filter: `num_parent_parcel like '${queryString}%' and shape is not null and cde_status='A'`
    }
    urls.push(`https://maps.mecklenburgcountync.gov/dirt/api/v1/query/master_address_table?${jsonToURL(pidArg)}`)
  }

  // Fetch all the things
  spinner = true
  Promise.all(urls.map(url =>
    fetch(url)
      .then(resp => resp.json())
  )).then(jsons => {
    spinner = false
    nomatch = false
    items = [].concat(...jsons).map(elem => {
      elem.groundpid = elem.groundpid || elem.pid
      return elem
    })
    if (items.length === 0) nomatch = true
  })

}
</script>


<AutoComplete placeholder="Try '2145 Suttle' or 'Jetton'" minChar={minChar} nomatch={nomatch} {items} on:hit={handleHit} on:query={handleQuery} value={$location.address} spinner={spinner} />