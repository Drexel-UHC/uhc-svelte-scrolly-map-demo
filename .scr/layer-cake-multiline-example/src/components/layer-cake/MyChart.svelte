<!-- 
# ============================================================================ #
# <script>
 -->
<script>
  export let selection;

  import { LayerCake, ScaledSvg, Html } from 'layercake';
  import { scaleOrdinal } from 'd3-scale';
  import { timeParse, timeFormat } from 'd3-time-format';
  import { format, precisionFixed } from 'd3-format';

  // import MultiLine from './MultiLineFade.svelte';
  import MultiLine from './MultiLineFade.svelte';
  import AxisX from './AxisX-html.svelte';
  import AxisY from './AxisY-html.svelte';

  import data from './fruit.js';

  // # ============================================================================ #
  // #   Import Data
  const seriesNamesAll = Object.keys(data[0]).filter((d) => d !== xKey);
  const seriesColorsAll = ['#ffe4b8', '#ffb3c0', '#ff7ac7', '#ff00cc'];
  const seriesAll = seriesNamesAll.map((name, index) => {
    return { name: name, color: seriesColorsAll[index] };
  });

  const dataLongAll = seriesNamesAll.map((key) => {
    return {
      [zKey]: key,
      values: data.map((d) => {
        d[xKey] = typeof d[xKey] === 'string' ? parseDate(d[xKey]) : d[xKey]; // Conditional required for sapper
        return {
          [yKey]: +d[key],
          [xKey]: d[xKey],
        };
      }),
    };
  });

  const xKey = 'month';
  const yKey = 'value';
  const zKey = 'fruit';
  let seriesNames;
  let seriesColors;
  const parseDate = timeParse('%Y-%m-%d');
  const flatten = (data) =>
    data.reduce((memo, group) => {
      return memo.concat(group.values);
    }, []);
  let dataLong;
  let formatTickX = timeFormat('%b. %e');
  let formatTickY = (d) => format(`.${precisionFixed(d)}s`)(d);

  $: {
    console.log(`--- MyCharts (${selection.selected})---`);

    seriesNames = seriesAll
      .filter((d) => selection.selected.includes(d.name))
      .map((d) => d.name);
    seriesColors = seriesAll
      .filter((d) => selection.selected.includes(d.name))
      .map((d) => d.color);

    dataLong = dataLongAll.filter((d) => selection.selected.includes(d[zKey]));

    console.log(selection);
    console.log(dataLong);
    console.log(flatten(dataLong));
  }
</script>

<!-- 
# ============================================================================ #
# <markup>
 -->

<div class="chart-container">
  <LayerCake
    ssr={true}
    percentRange={true}
    padding={{ top: 7, right: 10, bottom: 20, left: 25 }}
    x={xKey}
    y={yKey}
    z={zKey}
    zScale={scaleOrdinal()}
    zDomain={seriesNames}
    zRange={seriesColors}
    flatData={flatten(dataLong)}
    yDomain={[0, null]}
    data={dataLong}
  >
    <Html>
      <AxisX
        gridlines={false}
        ticks={data.map((d) => d[xKey]).sort((a, b) => a - b)}
        formatTick={formatTickX}
        snapTicks={true}
        tickMarks={true}
      />
      <AxisY baseline={true} formatTick={formatTickY} />
    </Html>

    <ScaledSvg>
      <MultiLine />
    </ScaledSvg>
  </LayerCake>
</div>

<!-- 
# ============================================================================ #
# <style>
 -->

<style>
  /*
		The wrapper div needs to have an explicit width and height in CSS.
		It can also be a flexbox child or CSS grid element.
		The point being it needs dimensions since the <LayerCake> element will
		expand to fill it.
	*/
  .chart-container {
    width: 100%;
    height: 100%;
  }
</style>
