<!-- 
  # ============================================================================ #
  #  ............... script ...............
-->

<script>
  // # ============================================================================ #
  // # Imports
  import { onMount } from 'svelte';
  import Scroller from './layout/Scroller.svelte';
  import {
    Map,
    MapSource,
    MapLayer,
    MapTooltip,
  } from '../libs/@onsvisual/svelte-maps';
  import { getData, getColor, getTopo } from './utils.js';

  // # ============================================================================ #
  // # Map objects

  const colors = {
    seq5: [
      'rgb(234, 236, 177)',
      'rgb(169, 216, 145)',
      'rgb(0, 167, 186)',
      'rgb(0, 78, 166)',
      'rgb(0, 13, 84)',
    ],
    div10: [
      '#67001f',
      '#b2182b',
      '#d6604d',
      '#f4a582',
      '#fddbc7',
      '#d1e5f0',
      '#92c5de',
      '#4393c3',
      '#2166ac',
      '#053061',
    ],
  };
  const paData = './data/data_county.csv';
  const paBounds = {
    url: './data/geo_counties.json',
    layer: 'geog',
    code: 'AREANM',
  };
  const bbox = {
    pa: [
      [-80.519851, 38.788657],
      [-66.885444, 47.459833],
    ],
  };

  // Bindings
  let map;

  // Data
  let data = {};
  let geojson;

  // State
  let zoom;
  let center = {};
  let hovered, selected;

  // Get geometry for geojson maps
  getTopo(paBounds.url, paBounds.layer).then((res) => {
    geojson = res;
  });

  // Get data for geojson maps
  getData(paData).then((res) => {
    let vals = res.map((d) => d.age_med).sort((a, b) => a - b);
    let len = vals.length;
    let breaks = [
      vals[0],
      vals[Math.floor(len * 0.2)],
      vals[Math.floor(len * 0.4)],
      vals[Math.floor(len * 0.6)],
      vals[Math.floor(len * 0.8)],
      vals[len - 1],
    ];
    res.forEach((d) => {
      d.color = getColor(d.age_med, breaks, colors.seq5);
    });

    data.pa = res;
  });

  // # ============================================================================ #
  // # Scroller Setup
  const threshold = 0.65;
  let id = {}; // Object to hold visible section IDs of Scroller components
  let idPrev = {}; // Object to keep track of previous IDs, to compare for changes
  onMount(() => {
    idPrev = { ...id };
  });
  function runActions(codes = []) {
    //// Code to run Scroller actions when new caption IDs come into view
    codes.forEach((code) => {
      if (id[code] != idPrev[code]) {
        // if caption id changes then run then run following code to update chart
        if (actions[code][id[code]]) {
          actions[code][id[code]]();
        }
        idPrev[code] = id[code];
      }
    });
  }

  $: {
    // Run above code when 'id' object changes
    if (id) {
      runActions(Object.keys(actions));
    }
  }

  // # ============================================================================ #
  // # Scroller Action

  let showSources = true;
  let showLayers = true;
  let visLayers = true;
  let showMapLayer = false;
  let actions = {
    map: {
      map01: () => {
        console.log(`######### map01`);
        showMapLayer = false;
      },
      map02: () => {
        console.log(`######### map02`);
        showMapLayer = true;
      },
      map03: () => {
        console.log(`######### map03`);
        showMapLayer = true;
      },
    },
  };
</script>

<!-- 
  # ============================================================================ #
  #  ............... scrolly ...............
-->

<Scroller {threshold} bind:id={id['map']} splitscreen={true}>
  <div slot="background">
    <figure>
      <div class="col-full height-full">
        <Map
          id="map"
          style="./data/style-osm.json"
          location={{ bounds: bbox.pa }}
          bind:map
          bind:zoom
          bind:center
        >
          <MapSource
            id="paBounds"
            type="geojson"
            data={geojson}
            promoteId={paBounds.code}
            maxzoom={13}
          >
            <MapLayer
              id="pcon-fill"
              custom={(showMapLayer = showMapLayer)}
              data={data.pa}
              type="fill"
              hover={true}
              bind:hovered
              select={true}
              bind:selected
              paint={{
                'fill-color': [
                  'case',
                  ['!=', ['feature-state', 'color'], null],
                  ['feature-state', 'color'],
                  'rgba(255, 255, 255, 0)',
                ],
                'fill-opacity': 0.7,
              }}
            >
              <MapTooltip content={`Code: ${hovered}`} />
            </MapLayer>
            <MapLayer
              id="pcon-line"
              custom={(showMapLayer = showMapLayer)}
              type="line"
              paint={{
                'line-color': [
                  'case',
                  ['==', ['feature-state', 'selected'], true],
                  'black',
                  ['==', ['feature-state', 'hovered'], true],
                  'orange',
                  'rgba(255, 255, 255, 0)',
                ],
                'line-width': [
                  'case',
                  ['==', ['feature-state', 'selected'], true],
                  2,
                  1,
                ],
              }}
            />
          </MapSource>
        </Map>
        <div class="stickDev">
          {id.map}
        </div>
      </div>
    </figure>
  </div>

  <div slot="foreground">
    <section data-id="map01">
      <div class="col-medium">
        <p><strong>OSM base map</strong></p>
      </div>
    </section>
    <section data-id="map02">
      <div class="col-medium">
        <p><strong>add boundaries</strong></p>
      </div>
    </section>
    <section data-id="map03">
      <div class="col-medium">
        <p><strong>add median age data layer</strong></p>
      </div>
    </section>
  </div>
</Scroller>

<!-- 
  # ============================================================================ #
  #  ............... style ...............
-->
<style>
  /* Styles specific to elements within the demo */
  :global(svelte-scroller-foreground) {
    pointer-events: none !important;
  }
  :global(svelte-scroller-foreground section div) {
    pointer-events: all !important;
  }
  select {
    max-width: 350px;
  }
  .stickDev {
    position: fixed;
    bottom: 0;
    right: 0;
    background-color: white;
    padding: 10px;
  }
  .chart {
    margin-top: 45px;
    width: calc(100% - 5px);
  }
  .chart-full {
    margin: 0 20px;
  }
  .chart-sml {
    font-size: 0.85em;
  }
  /* The properties below make the media DIVs grey, for visual purposes in demo */
  .media {
    background-color: #f0f0f0;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-flow: column;
    flex-flow: column;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    text-align: center;
    color: #aaa;
  }
</style>
