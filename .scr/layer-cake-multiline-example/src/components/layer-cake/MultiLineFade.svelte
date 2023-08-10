<script>
  import { getContext } from 'svelte';
  import { fade } from 'svelte/transition';
  const {
    data,
    xGet,
    yGet,
    zGet,
    xScale,
    yScale,
    xRange,
    yRange,
    xDomain,
    yDomain,
  } = getContext('LayerCake');

  $: path = (values) => {
    console.log(`values`);
    console.log(values);
    const results =
      'M' +
      values
        .map((d) => {
          return $xGet(d) + ',' + $yGet(d);
        })
        .join('L');
    // console.log(results);
    return results;
  };
  console.log('RUN ----- MultiLine.svelte');
</script>

<g class="line-group">
  {#each $data as group}
    <path
      class="path-line"
      d={path(group.values)}
      stroke={$zGet(group)}
      transition:fade={{ duration: 500 }}
    />
  {/each}
</g>

<style>
  .path-line {
    fill: none;
    stroke-linejoin: round;
    stroke-linecap: round;
    stroke-width: 3px;
  }
</style>
