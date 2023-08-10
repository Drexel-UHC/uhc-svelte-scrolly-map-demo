<!-- 
  # ============================================================================ #
  #  ............... script ...............
-->

<script>
  // # ============================================================================ #
  // 1. Core imports
  import { setContext, onMount } from 'svelte';
  import { getMotion } from './utils.js';
  import { themes } from './config.js';
  import UHCHeader from './layout/UHCHeader.svelte';
  import UHCFooter from './layout/UHCFooter.svelte';
  import Header from './layout/Header.svelte';
  import Section from './layout/Section.svelte';
  import Media from './layout/Media.svelte';
  import Scroller from './layout/Scroller.svelte';
  import Filler from './layout/Filler.svelte';
  import Divider from './layout/Divider.svelte';
  import Toggle from './ui/Toggle.svelte';
  import Arrow from './ui/Arrow.svelte';

  // # ============================================================================ #
  // 2. Project sepecific imports
  import { getData, setColors, getBreaks, getColor } from './utils.js';
  import { colors } from './config.js';
  import { LineChart } from '../libs/@onsvisual/svelte-charts';

  // # ============================================================================ #
  // 3. Core config
  // Set theme globally (options are 'light', 'dark' or 'lightblue')
  let theme = 'light';
  setContext('theme', theme);
  setColors(themes, theme);

  // # ============================================================================ #
  // 4. Scroller Configs
  //  - These dont change much between projects.
  //// Config
  const threshold = 0.65;

  //// State

  let animation = getMotion(); // Set animation preference depending on browser preference
  let hover = true;
  let hovered = null;
  let hoveredScatter = null;
  let select = true;
  let selected = null;
  let selectedScatter = null;
  let id = {}; // Object to hold visible section IDs of Scroller components
  let idPrev = {}; // Object to keep track of previous IDs, to compare for changes
  onMount(() => {
    idPrev = { ...id };
  });

  // Scroll Updater
  function runActions(codes = []) {
    //// Code to run Scroller actions when new caption IDs come into view
    codes.forEach((code) => {
      if (id[code] != idPrev[code]) {
        // if caption id changes then run then run following code to update chart
        if (actions[code][id[code]]) {
          actions[code][id[code]]();
        }
        idPrev[code] = id[code];
        step = id[code];
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
  // 5. Project Configs
  // THese will change across projects

  // # ============================================================================ #
  //   5.1 Scrolly actions *********
  let step = 'chart01';
  let data; // initializes async in 5.5
  // let yKey = 'apples';
  let yMin = 0;
  // In this fake data. flowers = 'philly' and apples = 'us average'
  let groups_template = [
    { group: 'apples', color: '#206095' },
    { group: 'cherries', color: '#A8BD3A' },
    { group: 'dates', color: '#003C57' },
    { group: 'flowers', color: '#27A0CC' },
  ];
  let colors_all = groups_template.map((d) => d.color);
  let groups_all = groups_template.map((d) => d.group);
  let groups_normal = groups_all.filter((d) => d != 'flowers');
  let groups_selected = groups_normal;
  let groups_to_label = null;
  let longitudinal_annotation_layer = false;
  let xMax;
  let yMax = 85;
  let actions = {
    chart: {
      chart01: () => {
        data = data;
        yMin = 0;
        yMax = 85;
        groups_selected = groups_normal;
        groups_to_label = null;
        step = 'chart01';
        xMax = null;
        longitudinal_annotation_layer = false;
      },
      chart02: () => {
        data = data;
        yMin = 65;
        yMax = 85;
        groups_selected = groups_normal;
        groups_to_label = null;
        step = 'chart02';
        xMax = null;
        longitudinal_annotation_layer = false;
      },
      chart03: () => {
        data = data;
        yMin = 65;
        yMax = 85;
        groups_selected = groups_all;
        groups_to_label = null;
        step = 'chart03';
        xMax = null;
        longitudinal_annotation_layer = false;
      },
      chart04: () => {
        data = data;
        yMin = 65;
        yMax = 85;
        groups_selected = ['flowers'];
        groups_to_label = null;
        step = 'chart04';
        xMax = null;
        longitudinal_annotation_layer = false;
      },
      chart05: () => {
        data = data;
        yMin = 70;
        yMax = 75;
        groups_selected = ['flowers'];
        groups_to_label = ['flowers'];
        step = 'chart05';
        xMax = 1998;
        longitudinal_annotation_layer = false;
      },
      chart06: () => {
        data = data;
        yMin = 70;
        yMax = 75;
        groups_selected = ['flowers'];
        groups_to_label = ['flowers'];
        step = 'chart06';
        xMax = 2008;
        longitudinal_annotation_layer = false;
      },
      chart07: () => {
        data = data;
        yMin = 70;
        yMax = 75;
        groups_selected = ['flowers'];
        groups_to_label = null;
        step = 'chart07';
        xMax = null;
        longitudinal_annotation_layer = false;
      },
      chart08: () => {
        data = data;
        yMin = 70;
        yMax = 75;
        groups_selected = ['flowers'];
        groups_to_label = null;
        step = 'chart08';
        xMax = null;
        longitudinal_annotation_layer = true;
      },
    },
  };

  // # ============================================================================ #
  //   5.4 State

  // # ============================================================================ #
  //   5.5 Initialisation code (get data)

  getData(`./data/data_le.csv`).then((arr) => {
    data = arr;
  });
</script>

<!-- 
  # ============================================================================ #
  #  ............... markup ...............
-->

<!-- 
  # ============================================================================ #
  #  Header
-->
<!-- 
<UHCHeader filled={true} center={false} />

<Header
  bgcolor="#206095"
  bgfixed={true}
  theme="dark"
  center={false}
  short={true}
>
  <h1>UHC Svelte Scrolly Template</h1>
  <p class="text-big" style="margin-top: 5px">
    Epsom Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sequi
    voluptate sed quisquam inventore quia odio illo maiores cum enim, aspernatur
    laboriosam amet ipsam, eligendi optio dolor doloribus minus! Dicta, laborum?
  </p>
  <p style="margin-top: 20px">DD MMM YYYY</p>
  <p>
    <Toggle
      label="Animation {animation ? 'on' : 'off'}"
      mono={true}
      bind:checked={animation}
    />
  </p>
  <div style="margin-top: 90px;">
    <Arrow color="white" {animation}>Scroll to begin</Arrow>
  </div>
</Header> -->
<!-- 
  # ============================================================================ #
  #  Intro
-->
<!-- <Section>
  <h2>Line Chart</h2>
  <p style="padding-bottom: 1rem;">
    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Impedit commodi
    aperiam autem doloremque, sapiente est facere quidem praesentium expedita
    rerum reprehenderit esse fuga, animi pariatur itaque ullam optio minima eum?
  </p>
</Section> -->

<Divider />

<!-- 
  # ============================================================================ #
  #  Scrolly 1 ******************
-->

<Scroller {threshold} bind:id={id['chart']} splitscreen={true}>
  <div slot="background">
    <figure>
      <div class="col-wide height-full">
        <div class="chart">
          {#if data && id && yMin >= 0}
            <LineChart
              {data}
              height={500}
              xKey="year"
              area={false}
              yKey="value"
              colors={colors_all}
              {groups_all}
              {groups_selected}
              {groups_to_label}
              {step}
              {yMin}
              {yMax}
              {xMax}
              areaOpacity={0.3}
              {animation}
              zKey="group"
              {longitudinal_annotation_layer}
            />
          {/if}
        </div>
      </div>
    </figure>
  </div>

  <div slot="foreground">
    <section data-id="chart01">
      <div class="col-medium">
        <p>
          Trend of the cost of <strong>some fruits</strong> over time.
        </p>
      </div>
    </section>
    <section data-id="chart02">
      <div class="col-medium">
        <p>
          Let <strong>zoom in on y-axis</strong> range of interest to better visualize
          the data.
        </p>
      </div>
    </section>
    <section data-id="chart03">
      <div class="col-medium">
        <p>
          We can <strong>add data</strong> to introduce a new group.
        </p>
      </div>
    </section>
    <section data-id="chart04">
      <div class="col-medium">
        <p>
          We can <strong>remove data</strong> to emphasize a narrative.
        </p>
      </div>
    </section>
    <section data-id="chart05">
      <div class="col-medium">
        <p>
          We can also <strong>focus on certain ranges on the x-axis</strong> which
          in this case is years.
        </p>
        <p>Between 1980 and 2000 tHe price of flowers increases steadily.</p>
      </div>
    </section>
    <section data-id="chart06">
      <div class="col-medium">
        <p>Flower prices starts to stagnate after the year 2000.</p>
      </div>
    </section>
    <section data-id="chart07">
      <div class="col-medium">
        <p>In fact after 2010, flowers prices start dropping.</p>
      </div>
    </section>
    <section data-id="chart08">
      <div class="col-medium">
        <p>So overall we see three phases in trends in Life Expectancy</p>
        <ul>
          <li style="color:green">2000 - 1998 Increasing</li>
          <li style="color:#FFBF00">1999 - 2009 Stagnation</li>
          <li style="color:red">2010 - 2018 Decreasing</li>
        </ul>
      </div>
    </section>
  </div>
</Scroller>

<Divider />

<!-- 
  # ============================================================================ #
  #  Conclusion
-->

<Section>
  <h2>Conclusions</h2>
  <p>
    Epsom Lorem ipsum dolor sit amet consectetur adipisicing elit. A magni
    ducimus amet repellendus cupiditate? Ad optio saepe ducimus. At eveniet ad
    delectus enim voluptatibus. Quaerat eligendi eaque corrupti possimus
    molestiae?
  </p>
</Section>

<!-- 
  # ============================================================================ #
  #  Footer
-->

<UHCFooter />
<div class="stickDev">
  step: {step}
</div>

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
