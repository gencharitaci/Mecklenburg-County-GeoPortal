<script>
  import { location } from "../store.js";
  import Title from "./Title.svelte";
  import Resources from "./Resources.svelte";
  import Map from "./Map.svelte";
  import Representative from "./Representative.svelte";
  import RecordHighlight from "./RecordHighlight.svelte";
  import jsonToURL from "../js/jsonToURL.js";

  // Map
  let showMap = false;

  // Resources
  const resourceLinks = [
    {
      name: "Mecklenburg County Board of Elections",
      url: "https://vote.mecknc.gov/",
    },
    {
      name: "Voting Precincts and Polling Locations on Open Mapping",
      url: "https://maps.mecklenburgcountync.gov/openmapping/data.html#vot",
    },
    {
      name: "Districts on Open Mapping",
      url: "https://maps.mecklenburgcountync.gov/openmapping/data.html#districts",
    },
  ];

  // Local data catchers
  let officials = null;
  let districts = null;
  let nationalHouse = [];
  let stateSenate = [];
  let stateHouse = [];
  let countyCommission = [];
  let countyBoard = [];
  let local = [];
  let pollingLocation = {
    headline: null,
    sub: null,
    detail: null,
  };
  let mapPoints = [];


    // location.subscribe((value) => {
    // const [lng, lat] = value.lnglat;
    
    // Promise.all([
    //   fetch(
    //     "https://maps.mecklenburgcountync.gov/dirt/api/v1/query/boe_elected_officials?sort=branch,district"
    //     // "https://maps.mecklenburgcountync.gov/dirt/api/v1/query/boe_elected_officials?sort=branch,district&limit=400"
    //   ).then((resp) => resp.json()),
    //   fetch(
    //     `https://maps.mecklenburgcountync.gov/dirt/api/v1/intersect_point/view_political_districts/${$location.lnglat[0]},${$location.lnglat[1]},4326?columns=districttype,district`
    //   ).then((resp) => resp.json()),
    // ]).then((data) => {
    //   officials = [...new Set(data[0])];

  location.subscribe(async (location) => {
    const [lng, lat] = location.lnglat;
    try {
      const [officialsResp, districtsResp] = await Promise.all([
        fetch(
          "https://maps.mecklenburgcountync.gov/dirt/api/v1/query/boe_elected_officials?sort=branch,district&limit=365"
          // "https://maps.mecklenburgcountync.gov/dirt/api/v1/query/boe_elected_officials?sort=branch,district&limit=300"
        ),
        fetch(
          `https://maps.mecklenburgcountync.gov/dirt/api/v1/intersect_point/view_political_districts/${lng},${lat},4326?columns=districttype,district`
        ),
      ]);

      // Check if responses are successful before proceeding.
      if (!officialsResp.ok || !districtsResp.ok) {
        throw new Error("Failed to fetch data from one or more APIs.");
      }

      // Convert both responses to JSON using await.
      const [officialsData, districtsData] = await Promise.all([
        officialsResp.json(),
        districtsResp.json(),
      ]);

      // national house
      nationalHouse = officialsData.filter(
        (
          el
        ) =>
          el.branch.indexOf("US House of Representatives") !== -1 &&
          el.district ===
            districtsData.filter(
              (
                el
              ) => el.districttype === "national_congressional"
            )[0].district
      );


      // county commsion
      countyCommission = officialsData.filter(
        (el) =>
          el.branch.indexOf("Board of Commissioners") !== -1 &&
          (el.district ===
            districtsData.filter(
              (el) =>
                el.districttype === "county_commission"
            )[0].district ||
            el.district === "At-Large")
      );
      // school board
      countyBoard = officialsData.filter(
        (el) =>
          el.branch.indexOf("Board of Education") !== -1 &&
          (el.district ===
            districtsData.filter(
              (el) =>
                el.districttype === "school_board"
            )[0].district ||
            el.district === "At-Large")
      );
      // state senate
      stateSenate = officialsData.filter(
        (/** @type {{ branch: string | string[]; district: any; }} */ el) =>
          el.branch.indexOf("NC State Senate") !== -1 &&
          el.district ===
            districtsData.filter(
              (el) =>
                el.districttype === "state_senate"
            )[0].district
      );
      // state house
      stateHouse = officialsData.filter(
        (/** @type {{ branch: string | string[]; district: any; }} */ el) =>
          el.branch.indexOf("NC House of Representatives") !== -1 &&
          el.district ===
            districtsData.filter(
              (el) =>
                el.districttype === "state_house"
            )[0].district
      );
      // local
      if (
        districtsData.filter(
          (el) =>
            el.districttype === "charlotte_city_council"
        ).length > 0
      ) {
        // charlotte
        local = officialsData.filter(
          (
            /** @type {{ branch: string | string[]; district: string; }} */ el
          ) =>
            el.branch.indexOf("Charlotte") !== -1 &&
            (el.district ===
              districtsData.filter(
                (el) =>
                  el.districttype === "charlotte_city_council"
              )[0].district ||
              el.district === "At-Large")
        );
      } else if (
        districtsData.filter(
          (/** @type {{ districttype: string; district: string; }} */ el) =>
            el.districttype === "jurisdictions" &&
            el.district != "Stallings" &&
            el.district != "Mecklenburg"
        ).length > 0
      ) {
        // towns
        local = officialsData.filter(
          (/** @type {{ branch: string | any[]; }} */ el) =>
            el.branch.indexOf(
              districtsData.filter(
                (el) =>
                  el.districttype === "jurisdictions"
              )[0].district
            ) !== -1
        );
      }

      
      fetchPollingLocation(
        districtsData.filter(
          (el) =>
            el.districttype === "voting_precincts"
        )[0].district
      );
      
      officials = officialsData;
      

      } catch (error) {
    // Handle any errors that occurred during the fetch.
    console.error("Error fetching location data:", error);
  }
  });

  /**
   * @param {any} precno
   */
  function fetchPollingLocation(precno) {
    const params = {
      geom_column: "voting_precincts.the_geom",
      columns: `name,
        address,
        precno,
        st_x(st_transform(the_geom, 4326)) as lng,
        st_y(st_transform(the_geom, 4326)) as lat,
        ST_Distance(the_geom,ST_Transform(GeomFromText('POINT(${$location.lnglat[0]} ${$location.lnglat[1]})',4326), 2264)) as distance
        `,
      filter: `precno = ${precno}`,
    };
    fetch(
      `https://maps.mecklenburgcountync.gov/dirt/api/v1/query/polling_locations?` + jsonToURL(params)
    )
      .then((response) => response.json())
      .then((json) => {
        pollingLocation.headline = json[0].name;
        pollingLocation.sub = json[0].address;
        pollingLocation.detail = `Precinct ${json[0].precno}`;
        mapPoints = [
          {
            label: "V",
            lngLat: [json[0].lng, json[0].lat],
            name: json[0].name,
            address: `${json[0].address}`,
          },
        ];
      });
  }
</script>

<Title title="VOTING" icon="voting" />

<Map {showMap} {mapPoints} />

<!-- Polling Location -->

<div class="flex flex-row flex-wrap justify-around print:block">
  <RecordHighlight
    top="Your Polling Location is"
    headline={pollingLocation.headline}
    sub={pollingLocation.sub}
    detail={pollingLocation.detail}
  />
</div>


{#if officials}
  <!-- National -->
  <div class="flex flex-row flex-wrap justify-around print:block">
    <h2 class="voting-h2">National</h2>
    <Representative
      reps={officials.filter(
        (el) => el.branch === "President of the United States"
      )}
    />
    <Representative
      reps={officials.filter(
        (el) => el.branch === "Vice President of the United States"
      )}
    />
    <Representative
      reps={officials.filter((el) => el.branch === "US Senate")}
    />
    <Representative reps={nationalHouse} />
  </div>

  <!-- State -->
  <div class="flex flex-row flex-wrap justify-around print:block">
    <h2 class="voting-h2">State</h2>
    <Representative
      reps={officials.filter((el) => el.branch.indexOf("Governor") !== -1)}
    />
    <Representative reps={stateSenate} />
    <Representative reps={stateHouse} />
  </div>

  <!-- County -->
  <div class="flex flex-row flex-wrap justify-around print:block">
    <h2 class="voting-h2">County</h2>
    <Representative reps={countyCommission} />
    <Representative reps={countyBoard} />
  </div>

  <!-- Local -->
  <div class="flex flex-row flex-wrap justify-around print:block">
    <h2 class="voting-h2">Local</h2>
    <Representative reps={local} />
  </div>
{/if}

<Resources links={resourceLinks} />

<style>
  .voting-h2 {
    @apply text-center w-full text-3xl tracking-widest text-gray-600 dark:text-gray-400 pt-12 uppercase font-bold;
  }
</style>
