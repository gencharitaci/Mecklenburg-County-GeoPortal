import jsonToURL from './jsonToURL'

/**
 * @param {any[]} lnglat
 */
async function fetchNearestMAT(lnglat) {
  const params = {
    geom_column: "shape",
    columns: "groundpid, round(ST_X(ST_Transform(shape, 4326))::NUMERIC,4) as lng, round(ST_Y(ST_Transform(shape, 4326))::NUMERIC,4) as lat, num_parent_parcel as pid, full_address as address",
    limit: 1
  }
  const response = await fetch(`https://maps.mecklenburgcountync.gov/dirt/api/v1/nearest/master_address_table/${lnglat.join(',')},4326?${jsonToURL(params)}`)
  const json = await response.json()
  return json
}

export default fetchNearestMAT