<svelte:options accessors={true} />

<script>
  import { LayerCake, Svg, Html } from 'layercake';
  import { scaleOrdinal, scaleLinear, scaleSymlog } from 'd3-scale';
  import { tweened } from 'svelte/motion';
  import { cubicInOut } from 'svelte/easing';
  import { groupData, stackData } from '../js/utils';

  import SetCoords from './shared/SetCoords.svelte';
  import Line from './shared/Line.svelte';
  import Area from './shared/Area.svelte';
  import AxisX from './shared/AxisX.svelte';
  import AxisY from './shared/AxisY.svelte';
  import Legend from './shared/Legend.svelte';
  import Title from './shared/Title.svelte';
  import Footer from './shared/Footer.svelte';
  import Labels from './shared/Labels.svelte';
  import LabelsHTML from './shared/Labels-html.svelte';
  import LongitudinalAnnotationLayer from './custom/LongitudinalAnnotationLayer.svelte';

  export let data;
  export let height = 250; // number of pixels or valid css height string
  export let animation = true;
  export let duration = 800;
  export let xKey = 'x';
  export let yKey = 'y';
  export let zKey = null;
  export let idKey = zKey;
  export let labelKey = idKey;
  export let yScale = 'linear';
  export let yFormatTick = (d) => d;
  export let yMax = null;
  export let yMin = 0;
  export let xMax = null;
  export let xMin = null;
  export let xAxis = true;
  export let yAxis = true;
  export let xTicks = 4;
  export let yTicks = 4;
  export let title = null;
  export let footer = null;
  export let legend = false;
  export let labels = false;
  export let snapTicks = true;
  export let line = true;
  export let area = true;
  export let mode = 'default';
  export let areaOpacity = 1;
  export let padding = { top: 0, bottom: 20, left: 35, right: 0 };
  export let color = null;
  export let colors = color
    ? [color]
    : [
        '#206095',
        '#A8BD3A',
        '#003C57',
        '#27A0CC',
        '#118C7B',
        '#F66068',
        '#746CB1',
        '#22D0B6',
        'lightgrey',
      ];
  export let lineWidth = 2.5;
  export let interactive = true;
  export let xPrefix = '';
  export let xSuffix = '';
  export let yPrefix = '';
  export let ySuffix = '';
  export let hover = false;
  export let hovered = null;
  export let colorHover = 'orange';
  export let select = false;
  export let selected = null;
  export let colorSelect = '#206095';
  export let highlighted = [];
  export let colorHighlight = '#206095';

  // custom
  export let groups_all;
  export let groups_selected;
  export let groups_to_label;
  export let step;
  export let longitudinal_annotation_layer;
  $: {
    console.log(` ******************* LineChart ${step}  `);
  }

  const tweenOptions = {
    duration: duration,
    easing: cubicInOut,
  };
  const coords = tweened(undefined, tweenOptions);

  const distinct = (d, i, arr) => arr.indexOf(d) == i;

  function getTotals(data, keys) {
    let arr = [];
    keys.forEach((key) => {
      let vals = data.filter((d) => d[xKey] == key).map((d) => d[yKey]);
      let sum = vals.reduce((acc, curr) => acc + curr);
      arr.push(sum);
    });
    return arr;
  }
  // # ============================================================================ #
  // #   xDomain updates
  const xDomSet = (data, mode, xKey, xMin, xMax) => {
    const vec__all_x_values = data.map((d) => d[xKey]).filter(distinct);
    const new_x_max = xMax ? xMax : Math.max(...vec__all_x_values);
    const new_x_min = xMin
      ? xMin
      : Math.min(...data.map((d) => d[xKey]).filter(distinct));
    const newXDom = [new_x_min, new_x_max];
    return newXDom;
  };
  function xDomUpdate(data, mode, xKey, xMin, xMax) {
    let newXDom = xDomSet(data, mode, xKey, xMin, xMax);
    if (newXDom[0] != xDom[0] || newXDom[1] != xDom[1]) {
      xDomain.set(newXDom, { duration: animation ? duration : 0 });
      xDom = newXDom;
    }
  }
  let xDom = xDomSet(data, mode, xKey, xMin, xMax);
  const xDomain = tweened(xDom, tweenOptions);
  $: xDomUpdate(data, mode, xKey, xMin, xMax);

  // # ============================================================================ #
  // #   yDomain updates
  const yDomSet = (data, mode, yKey, yMax) =>
    yMax
      ? [yMin, yMax]
      : mode == 'stacked' && yKey
      ? [
          yMin,
          Math.max(
            ...getTotals(data, data.map((d) => d[xKey]).filter(distinct))
          ),
        ]
      : [yMin, Math.max(...data.map((d) => d[yKey]))];
  function yDomUpdate(data, mode, yKey, yMax) {
    let newYDom = yDomSet(data, mode, yKey, yMax);
    if (newYDom[0] != yDom[0] || newYDom[1] != yDom[1]) {
      yDomain.set(newYDom, { duration: animation ? duration : 0 });
      yDom = newYDom;
    }
  }
  let yDom = yDomSet(data, mode, yKey, yMax);
  const yDomain = tweened(yDom, tweenOptions);
  $: yDomUpdate(data, mode, yKey, yMax);

  // # ============================================================================ #
  // #   zDomain updates

  $: zDomain = zKey ? data.map((d) => d.group).filter(distinct) : null;

  // Create a data series for each zKey (group)

  $: groupedData =
    mode == 'stacked'
      ? stackData(data, zDomain, yKey, zKey)
      : groupData(data, zDomain, zKey);
</script>

{#if title}
  <Title>{title}</Title>
{/if}
<slot name="options" />
<div
  class="chart-container"
  style="height: {typeof height == 'number' ? height + 'px' : height}"
>
  <LayerCake
    {padding}
    x={xKey}
    y={yKey}
    z={zKey}
    xDomain={$xDomain}
    yDomain={$yDomain}
    yScale={yScale == 'log' ? scaleSymlog() : scaleLinear()}
    zScale={scaleOrdinal()}
    {zDomain}
    zRange={colors}
    data={groupedData}
    flatData={data}
    custom={{
      type: 'line',
      mode,
      idKey,
      labelKey,
      coords,
      colorSelect,
      colorHover,
      colorHighlight,
      animation,
      duration,
      groups_all: groups_all,
      groups_selected: groups_selected,
      groups_to_label: groups_to_label,
      step: step,
      longitudinal_annotation_layer: longitudinal_annotation_layer,
    }}
    let:width
  >
    {#if width > 80}
      <!-- Hack to prevent rendering before xRange/yRange initialised -->
      <!-- <SetCoords /> -->
      <slot name="back" />
      <Svg pointerEvents={interactive}>
        {#if xAxis}
          <AxisX ticks={xTicks} {snapTicks} prefix={xPrefix} suffix={xSuffix} />
        {/if}
        {#if yAxis}
          <AxisY
            ticks={yTicks}
            formatTick={yFormatTick}
            prefix={yPrefix}
            suffix={ySuffix}
          />
        {/if}
        {#if area}
          <Area {mode} opacity={areaOpacity} />
        {/if}
        {#if line}
          <Line
            {lineWidth}
            {select}
            bind:selected
            {hover}
            bind:hovered
            {highlighted}
            on:hover
            on:select
          />
        {/if}
        {#if labels}
          <Labels {hovered} {selected} />
        {/if}
        <slot name="svg" />
      </Svg>

      <slot name="front" />
      <Html>
        <LabelsHTML />
        <LongitudinalAnnotationLayer />
      </Html>
    {/if}
  </LayerCake>
</div>
{#if legend && zDomain}
  <Legend domain={zDomain} {colors} {line} markerWidth={lineWidth} />
{/if}
{#if footer}
  <Footer>{footer}</Footer>
{/if}

<style>
  .chart-container {
    width: 100%;
  }
</style>
