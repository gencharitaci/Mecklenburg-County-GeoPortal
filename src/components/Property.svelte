<script>
  import { location } from '../store.js'
  import Title from './Title.svelte'
  import Resources from './Resources.svelte'
  import Table from './Table.svelte'
  import Map from './Map.svelte'
  import RecordHighlight from './RecordHighlight.svelte'
  import jsonToURL from '../js/jsonToURL.js'
  import { formatCommas, formatMoney, formatDate } from '../js/formatNumbers.js'

  // Tables
  const ownerTable = {
    caption: "Ownership",
    columns: ["Owner", "Address"],
    rows: []
  }
  const appraisalTable = {
    caption: "Tax Appraisal",
    columns: ["Year", "Building", "Land", "Extra", "Total"],
    alignRight: [2,3,4,5],
    footer: `<a href="http://taxbill.co.mecklenburg.nc.us/publicwebaccess/BillSearchResults.aspx?ParcelNum=${$location.pid}" target="_blank" rel="nofollow noopener noreferrer external">View Tax Bills</a>`,
    rows: []
  }
  const saleTable = {
    caption: "Sale History",
    columns: ["Date", "Deed", "Price"],
    alignRight: [2, 3, 4],
    rows: []
  }
  const useTable = {
    caption: "Land Use",
    columns: ["Use", "Units", "Tax Neighborhood"],
    alignRight: [2],
    rows: []
  }
  const buildingTable = {
    caption: "Buildings",
    columns: ["Structure", "Year Built", "Exterior", "Area", "Beds", "Baths"],
    alignRight: [4,5,6],
    rows: []
  }
  const permitTable = {
    caption: "Building Permits",
    columns: ["Date", "Project", "Area", "Cost"],
    alignRight: [3,4],
    rows: []
  }

  // other variables
  let zoning = null

  // Map
  let showMap = false

  // Resources
  const resourceLinks = [
    {
      name: 'POLARIS',
      url: 'https://polaris3g.mecklenburgcountync.gov/'
    },
    {
      name: "County Assessor's Office",
      url: 'https://cao.mecknc.gov/'
    },
    {
      name: 'Office of the Tax Collector',
      url: 'https://www.mecknc.gov/taxcollections/Pages/Home.aspx'
    },
    {
      name: 'Charlotte Planning, Design and Development',
      url: 'https://www.charlottenc.gov/Growth-and-Development/Planning-and-Development'
    },
    {
      name: 'Tax data on Open Mapping',
      url: 'https://maps.mecklenburgcountync.gov/openmapping/data.html#tax'
    }
  ]

  location.subscribe(value => {
		fetchData()
	})

  function fetchData() {
    // reset variables
    zoning = null;
    [ownerTable, appraisalTable, saleTable, useTable, buildingTable, permitTable].forEach(item => {
      item.rows = []
    })

    // zoning
    fetch(`https://maps.mecklenburgcountync.gov/dirt/api/v1/intersect_point/view_zoning/${$location.lnglat.join(',')},4326?${jsonToURL({
      columns: 'zone_des,zone_class',
      geom_column: "the_geom"
    })}`)
      .then(response => response.json())
      .then(data => {
        data.length > 0 ?
          zoning = `Zoned as <span class="font-bold">${data[0].zone_class} ${data[0].zone_des}</span>` : zoning = null
      })
      .catch(ex => {
        console.log("parsing failed", ex);
      })

    // ownership
    fetch(`https://maps.mecklenburgcountync.gov/dirt/api/v1/query/tb_allowners?${jsonToURL({
      columns: 'lastname,firstname,address_1,address_2,city,state,zipcode',
      filter: `parcelid = '${$location.pid}'`
    })}`)
      .then(response => response.json())
      .then(data => {
        data.forEach(el => {
          ownerTable.rows.push([
            `${el.firstname || ''} ${el.lastname || ''}`,
            `${el.address_1} ${el.address_2 || ''}<br>${el.city}, ${el.state} ${el.zipcode}`
          ])
        })
      })
      .then(() => {
        ownerTable.rows = ownerTable.rows
      })
      .catch(ex => {
        console.log("parsing failed", ex);
      })

    // appraisal
    fetch(`https://maps.mecklenburgcountync.gov/dirt/api/v1/query/tb_allparceldata?${jsonToURL({
      columns: 'yearid,totalbuildingvalue,totalyarditemvalue,totallandvalue,totalvalue',
      filter: `parcelid = '${$location.pid}'`
    })}`)
      .then(response => response.json())
      .then(data => {
        data.forEach(el => {
          appraisalTable.rows.push([
            el.yearid,
            formatMoney(el.totalbuildingvalue),
            formatMoney(el.totallandvalue),
            formatMoney(el.totalyarditemvalue),
            formatMoney(el.totalvalue)
          ])
        })
      })
      .then(() => {
        appraisalTable.rows = appraisalTable.rows
      })
      .catch(ex => {
        console.log("parsing failed", ex);
      })

    // sale history
    fetch(`https://maps.mecklenburgcountync.gov/dirt/api/v1/query/tb_historicalsales?${jsonToURL({
      columns: 'saledate,saleprice,legalreference',
      filter: `parcelid = '${$location.pid}'`,
      sort: 'saledate DESC'
    })}`)
      .then(response => response.json())
      .then(data => {
        data.forEach(el => {
          const [deed_book, deed_page] = (el.legalreference || '').split('-');
          saleTable.rows.push([
            formatDate(el.saledate),
            `<a href="https://meckrod.manatron.com/RealEstate/SearchDetail.aspx?bk=${deed_book}&pg=${deed_page}&type=BkPg" title="Mecklenburg County Register of Deeds" target="_blank" rel="nofollow noopener noreferrer external">${deed_book}-${deed_page}</a>`,
            formatMoney(el.saleprice),
          ])
        })
      })
      .then(() => {
        saleTable.rows = saleTable.rows
      })
      .catch(ex => {
        console.log("parsing failed", ex);
      })

    // land use
    fetch(`https://maps.mecklenburgcountync.gov/dirt/api/v1/query/tb_allparceldata,tb_landvalues?${jsonToURL({
      columns: 'landuse_description,units,neighborhood_description',
      filter: `tb_allparceldata.landsize = tb_landvalues.units and tb_allparceldata.landusecode = tb_landvalues.landusecode and parcelid = '${$location.pid}'`
    })}`)
      .then(response => response.json())
      .then(data => {
        const seen = new Set();
        data.forEach(el => {
          const key = `${el.landuse_description}|${el.units}|${el.neighborhood_description}`;
          if (!seen.has(key)) {
            seen.add(key)
            useTable.rows.push([
              el.landuse_description,
              formatCommas(el.units),
              el.neighborhood_description || ''
            ])
          }
        })
      })
      .then(() => {
        useTable.rows = useTable.rows
      })
      .catch(ex => {
        console.log("parsing failed", ex);
      })

    // buildings
    fetch(`https://maps.mecklenburgcountync.gov/dirt/api/v1/query/tb_allbuildings?${jsonToURL({
      columns: 'buildingtype,yearbuilt,extwall,totalarea,bedrooms,fullbath,threequarterbath,halfbath',
      filter: `parcelid = '${$location.pid}'`
    })}`)
      .then(response => response.json())
      .then(data => {
        data.forEach(el => {
          buildingTable.rows.push([
            el.buildingtype,
            el.yearbuilt,
            el.extwall,
            formatCommas(el.totalarea) + ' Sq. Ft.',
            el.bedrooms,
            el.fullbath + el.threequarterbath + el.halfbath
          ])
        })
      })
      .then(() => {
        buildingTable.rows = buildingTable.rows
      })
      .catch(ex => {
        console.log("parsing failed", ex);
      })

    // building permits
    fetch(`https://maps.mecklenburgcountync.gov/dirt/api/v1/query/building_permits?${jsonToURL({
      columns: 'date_completed_co_process,project_name,square_footage,construction_cost',
      filter: `mat_parcel_id = '${$location.pid}'`,
      sort: 'date_completed_co_process DESC'
    })}`)
      .then(response => response.json())
      .then(data => {
        data.forEach(el => {
          permitTable.rows.push([
            formatDate(el.date_completed_co_process),
            el.project_name,
            formatCommas(el.square_footage) + ' Sq. Ft.',
            formatMoney(el.construction_cost)
          ])
        })
      })
      .then(() => {
        permitTable.rows = permitTable.rows
      })
      .catch(ex => {
        console.log("parsing failed", ex);
      })

  }

</script>

<Title title="PROPERTY" icon="property" />

<Map showMap={showMap} />

<div class="flex flex-row flex-wrap justify-around">
  <RecordHighlight top="Parcel ID" sub={zoning} headline={$location.pid} />
</div>

<Table {...ownerTable} />
<Table {...appraisalTable} />
<Table {...saleTable} />
<Table {...useTable} />
<Table {...buildingTable} />
<Table {...permitTable} />

<Resources links={resourceLinks} />
