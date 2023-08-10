<script>
  import { getContext, createEventDispatcher } from 'svelte';

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
  let coord_needs_update = false;

  // Initialize coord if needed

  if (!$coords) {
    setCoords($custom.customData, $custom, $x, $y, $r, $width);
  }

  $: {
    console.log(`*********************** Line ${$custom.step}`);
    console.log(`$custom`);
    console.log($custom.groups_selected);
    coord_needs_update = $coords.length != $custom.customData.length;
  }

  $: {
    if (coord_needs_update) {
      setCoords($custom.customData, $custom, $x, $y, $r, $width);
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
  function setCoords(data, custom, x, y, r, width) {
    console.log(
      `///////////////  Start setCoords()  Line.svelte ${custom.step}`
    );
    console.log(`original coords`);
    console.log($coords);
    let mode = custom.mode;
    let padding = custom.padding;
    let duration = custom.animation && width == prevWidth ? custom.duration : 0;

    prevWidth = width;

    let newcoords;
    if (type == 'bar') {
      newcoords = data.map((d, i) =>
        d.map((e, j) => {
          return {
            x:
              mode == 'default' ||
              mode == 'grouped' ||
              ((mode == 'comparison' || mode == 'stacked') && i == 0)
                ? 0
                : mode == 'stacked'
                ? x(data[i - 1][j])
                : x(e),
            y:
              mode == 'grouped'
                ? $yGet(e) + i * (1 / data.length) * $yScale.bandwidth()
                : $yGet(e),
            w:
              mode == 'default' ||
              mode == 'grouped' ||
              ((mode == 'comparison' || mode == 'stacked') && i == 0)
                ? x(e)
                : mode == 'stacked'
                ? x(e) - x(data[i - 1][j])
                : 0,
            h:
              mode == 'grouped'
                ? $yScale.bandwidth() / data.length
                : $yScale.bandwidth(),
          };
        })
      );
    } else if (type == 'column') {
      newcoords = data.map((d, i) =>
        d.map((e, j) => {
          return {
            x:
              mode == 'grouped' && $xScale.bandwidth
                ? $xGet(e) + i * (1 / data.length) * $xScale.bandwidth()
                : mode == 'grouped'
                ? $xGet(e)[0] +
                  i * (1 / data.length) * Math.max(0, $xGet(e)[1] - $xGet(e)[0])
                : $xScale.bandwidth
                ? $xGet(e)
                : $xGet(e)[0],
            y: y(e),
            w:
              mode == 'grouped' && $xScale.bandwidth
                ? $xScale.bandwidth() / data.length
                : mode == 'grouped'
                ? Math.max(0, $xGet(e)[1] - $xGet(e)[0]) / data.length
                : $xScale.bandwidth
                ? $xScale.bandwidth()
                : Math.max(0, $xGet(e)[1] - $xGet(e)[0]),
            h:
              mode == 'default' ||
              mode == 'grouped' ||
              ((mode == 'comparison' || mode == 'stacked') && i == 0)
                ? y(e)
                : mode == 'stacked'
                ? y(e) - y(data[i - 1][j])
                : 0,
          };
        })
      );
    } else if (type == 'scatter') {
      let rVal = (d) => (r ? $rGet(d) : $rRange[0]);
      newcoords = y
        ? data.map((d) => ({ x: x(d), y: y(d), r: rVal(d) }))
        : new AccurateBeeswarm(
            data,
            (d) => rVal(d),
            (d) => $xGet(d),
            padding,
            $yRange[0] / 2
          )
            .calculateYPositions()
            .map((d) => ({
              x: $xScale.invert(d.x),
              y: $yScale.invert(d.y),
              r: d.r,
            }));
    } else if (type == 'line') {
      // console.log('data for new coords');
      // console.log(data);
      // data.map((d, i) => {
      //   console.log(i);
      //   console.log(d);
      // });
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
    console.log(`new coords`);
    console.log(newcoords);
    console.log(`///////////////  END setCoords()  Line.svelte ${custom.step}`);
  }
</script>

{#if $coords.length == $custom.groups_selected.length}
  <g class="line-group">
    {#each $coords as group, i}
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
        stroke={$config.z ? $zGet($data[i][0]) : $config.zRange[0]}
        stroke-width={lineWidth}
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
