<script>
  import { location } from '../store.js'
  import Title from './Title.svelte'
  import Resources from './Resources.svelte'
  import Table from './Table.svelte'
  import Map from './Map.svelte'
  import jsonToURL from '../js/jsonToURL.js'
  import { formatCommas } from '../js/formatNumbers.js'

  // Magnet table
  const magnetTable = {
    columns: ["School", "Grades", "Address", "Focus", "Distance"],
    rows: []
  }

  // Current schools table
  const schoolsCurrent = {
    columns: ["School", "Grades", "Address", "Distance", "Grade*", "Growth Status*", "Grade Level Proficiency*"],
    rows: []
  }

  // Future schools table
  const schoolsFuture = JSON.parse(JSON.stringify(schoolsCurrent))

  // Magnet Zone
  let zone = ''

  // Map
  let showMap = false
  let mapPoints = []

  // Resources
  const resourceLinks = [
    {
      name: 'Charlotte-Mecklenburg Schools',
      url: 'https://www.cmsk12.org/'
    },
    {
      name: 'North Carolina Department of Public Instruction',
      url: 'https://www.dpi.nc.gov/'
    },
    {
      name: 'School data on Open Mapping',
      url: 'https://maps.mecknc.gov/openmapping/data.html?search=school'
    },
    {
      name: 'NC test scores: 23-24 grades for Charlotte-Mecklenburg Schools | Charlotte Observer',
      url: 'https://www.charlotteobserver.com/news/local/education/article291899680.html'
    },
  ]

  location.subscribe(value => {
		fetchData()
	})

  function fetchData() {
    // reset catchers
    [magnetTable, schoolsCurrent, schoolsFuture].forEach(item => {
      item.rows = []
    })
    zone = ''
    mapPoints = []

    fetchMagnet($location.lnglat[0], $location.lnglat[1])
    fetchSchools($location.lnglat[0], $location.lnglat[1])
  }

  function fetchSchools(lng, lat) {
    const urls = [
      `https://api.mcmap.org/v1/nearest/cms_parcels/${lng},${lat},4326?columns=high_zone,gradek,grade1,grade2,grade3,grade4,grade5,grade6,grade7,grade8,grade9,grade10,grade11,grade12&limit=1`,
      `https://api.mcmap.org/v1/nearest/cms_parcels_future_py/${lng},${lat},4326?columns=high_zone,gradek,grade1,grade2,grade3,grade4,grade5,grade6,grade7,grade8,grade9,grade10,grade11,grade12&limit=1`
    ]

    Promise.all(urls.map(url =>
      fetch(url).then(resp => resp.json())
    )).then(jsons => {

      // set transportation zone
      zone = jsons[0][0]["high_zone"];

      jsons.forEach(elem => {
        delete elem[0].distance
        delete elem[0].high_zone
      })

      // school numbers to fetch
      const schlnums = [...new Set(Object.values(jsons[0][0]).concat(Object.values(jsons[1][0])))]

      fetch(`https://api.mcmap.org/v1/query/view_cms_schools_metrics?columns=city,glp_2023_24,grade_2023_24,growth_status_2023_24,num as schlnum,address,name,type,ST_Distance(geom,ST_Transform(GeomFromText('POINT( ${lng} ${lat} )',4326), 2264)) as distance,st_x(st_transform(geom, 4326)) as lng, st_y(st_transform(geom, 4326)) as lat&filter=num in(${schlnums.join()})`)
        .then(schools => schools.json())
        .then(schools => {

          schools.forEach(school => {
            mapPoints.push({
              label: school.type.charAt(0),
              lngLat: [school.lng, school.lat],
              name: school.name,
              address: `${school.address}, ${school.city}`
            })
          })

          jsons.forEach((elem, idx) => {
            let results = []
            let schls = [...new Set(Object.values(elem[0]))]

            schls.forEach(scl => {
              let grades = []

              Object.keys(elem[0]).forEach(key => {
                if (elem[0][key] === scl) grades.push(key.replace("grade", '').toUpperCase())
              })

              let result = JSON.parse(JSON.stringify(schools.filter(el => el.schlnum === scl)[0]))
              result.grades = grades

              results.push([
                result.name,
                result.grades.join(', '),
                result.address,
                `${formatCommas(result.distance / 5280, 1)} miles`,
                result.grade_2023_24 || '',
                result.growth_status_2023_24 || '',
                result.glp_2023_24 ? result.glp_2023_24 + '%' : ''
              ])
            })

            idx === 0 ? schoolsCurrent.rows = results : schoolsFuture.rows = results
          })

        })

    })
  }

  function fetchMagnet(lng, lat) {
    const params = {
      filter: "magnet <> 'Non Magnet'",
      columns: `num,city,address,name,grade_level,coalesce(mag_focus, '') as mag_focus,st_x(st_transform(geom, 4326)) as lng,
          st_y(st_transform(geom, 4326)) as lat,magnet,glp_2023_24,grade_2023_24,growth_status_2023_24,
          ST_Distance(geom,ST_Transform(
          GeomFromText('POINT( ${lng} ${lat} )',4326), 2264)) as distance`,
      sort: 'distance'
    }

    fetch(`https://api.mcmap.org/v1/query/view_cms_schools_metrics?${jsonToURL(params)}`)
      .then(response => response.json())
      .then(data => {
        // make records for table
        data.forEach(el => {
          magnetTable.rows.push([
            el.name,
            el.grade_level,
            `${el.address}, ${el.city}`,
            el.mag_focus,
            `${formatCommas(el.distance / 5280, 1)} miles`
          ])
        })
      })
      .then(() => {
        magnetTable.rows = magnetTable.rows
        mapPoints = mapPoints
      })
      .catch(ex => {
        console.log("parsing failed", ex);
      })
  }

</script>


<Title title="SCHOOLS" icon="school" />

<Map showMap={showMap} mapPoints={mapPoints} />

<Table
  rows={schoolsCurrent.rows}
  columns={schoolsCurrent.columns}
  caption="2023-2024 School Year"
  alignRight={[4]}
  alignCenter={[5,6,7]}
  footer="*2023-24 school year, North Carolina Department of Public Instruction"
/>

<Table
  rows={schoolsFuture.rows}
  columns={schoolsFuture.columns}
  caption="2024-2025 School Year"
  alignRight={[4]}
  alignCenter={[5,6,7]}
  footer="*2023-24 school year, North Carolina Department of Public Instruction"
/>

<Table
  rows={magnetTable.rows}
  columns={magnetTable.columns}
  caption={'Magnet Schools (You Are in <a href="https://cmschoice.org/your-choices/schools/" target="_blank">Zone ' + zone + '</a>)'}
  alignRight={[5]}
/>

<p class="pt-8 pb-2">
  Transportation eligibility is determined by the transportation zone in which you live.
  The county is divided into three transportation zones:
  violet, blue and green.
  Magnet schools are assigned a zone to serve with transportation. Some programs
  provide county-wide transportation, meaning that regardless of your zone,
  you would receive transportation. For more information please contact
  Charlotte-Mecklenburg School Transportation Services at <a href="tel:9803436715">(980) 343-6715</a>.
</p>

<p class="pt-2 pb-8">
  School assignment information is based on data provided by Charlotte-Mecklenburg Schools and Mecklenburg
  County GIS. For questions, concerns, or confirmation of schools assignments, please contact Charlotte-Mecklenburg Schools at <a href="email:planning@cms.k12.nc.us">planning@cms.k12.nc.us</a> or <a href="tel:9803436246">(980) 343-6246</a>.
</p>

<Resources links={resourceLinks} />
