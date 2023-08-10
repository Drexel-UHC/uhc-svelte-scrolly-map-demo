<script>
  import { getContext, createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  let {
    data,
    xScale,
    yScale,
    zGet,
    config,
    custom,
    x,
    y,
    r,
    zRange,
    xGet,
    yGet,
    rGet,
    yRange,
    rRange,
    width,
  } = getContext('LayerCake');

  const dispatch = createEventDispatcher();

  export let lineWidth = 2.5;
  export let hover = false;
  export let hovered = null;
  export let select = false;
  export let selected = null;
  export let highlighted = [];

  let coords = $custom.coords;
  let step = $custom.step;
  let idKey = $custom.idKey;
  let colorHover = $custom.colorHover ? $custom.colorHover : 'orange';
  let colorSelect = $custom.colorSelect ? $custom.colorSelect : '#206095';
  let colorHighlight = $custom.colorHighlight
    ? $custom.colorHighlight
    : '#206095';
  let type = $custom.type;
  let prevWidth = $width;
  let groups_all = $custom.groups_all;
  let groups_selected = $custom.groups_selected;
  let debounceTimer;
  let debounceValue = 100;
  let coords_subset;
  let colors_subset = $zRange;
  $: {
    debouncedSetCoords($data, $custom, $x, $y, $r, $width);
  }

  // Path subset logic here
  $: {
    groups_selected = $custom.groups_selected;

    const index_to_include = groups_all
      .map((item, index) => (groups_selected.includes(item) ? index : -1))
      .filter((index) => index !== -1);

    if ($coords) {
      coords_subset = index_to_include.map((index) => $coords[index]);
      colors_subset = index_to_include.map((index) => $zRange[index]);
    }
  }

  // Function to make SVG path
  const makePath = (group) => {
    let path =
      'M' +
      group
        .map((d) => {
          return $xScale(d.x) + ',' + $yScale(d.y);
        })
        .join('L');
    return path;
  };

  function doHover(e, d) {
    if (hover) {
      hovered = d ? d[0][idKey] : null;
      dispatch('hover', {
        id: hovered,
        data: d,
        event: e,
      });
    }
  }

  function doSelect(e, d) {
    if (select) {
      selected = d ? d[0][idKey] : null;
      dispatch('select', {
        id: selected,
        data: d,
        event: e,
      });
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  const debouncedLog = debounce((val) => console.log(val), 200);
  function debouncedSetCoords(data, custom, x, y, r, width) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      let mode = custom.mode;
      let padding = custom.padding;
      let duration =
        custom.animation && width == prevWidth ? custom.duration : 0;

      prevWidth = width;

      let newcoords;
      if (type == 'line') {
        newcoords = data.map((d) =>
          d.map((e) => {
            return {
              x: x(e),
              y: y(e),
            };
          })
        );
      }
      coords.set(newcoords, { duration });
    }, debounceValue); // Debounce time: 200 milliseconds (adjust as needed)
  }
</script>

{#if coords_subset}
  <g class="line-group">
    {#each coords_subset as group, i}
      <path
        class="path-hover"
        d={makePath(group)}
        on:mouseover={(e) => doHover(e, $data[i])}
        on:mouseleave={(e) => doHover(e, null)}
        on:focus={(e) => doHover(e, $data[i])}
        on:blur={(e) => doHover(e, null)}
        on:click={(e) => doSelect(e, $data[i])}
      />
      <path
        class="path-line"
        d={makePath(group)}
        stroke={colors_subset[i]}
        stroke-width={lineWidth}
        transition:fade={{ delay: 0, duration: 300 }}
      />
    {/each}

    {#if idKey && (hover || selected || highlighted[0])}
      {#each $coords as group, i}
        {#if [hovered, selected, ...highlighted].includes($data[i][0][idKey])}
          <path
            class="path-overlay"
            d={makePath(group)}
            stroke={$data[i][0][idKey] == hovered
              ? colorHover
              : $data[i][0][idKey] == selected
              ? colorSelect
              : colorHighlight}
            stroke-width={lineWidth + 1.5}
          />
        {/if}
      {/each}
    {/if}
  </g>
{/if}

<style>
  path {
    fill: none;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .path-hover {
    stroke: rgba(255, 255, 255, 0);
    stroke-width: 7;
  }
  .path-line,
  .path-overlay {
    pointer-events: none;
  }
</style>
