<script>
  import { getContext } from 'svelte';
  import { max, min } from 'd3-array';
  import { fade } from 'svelte/transition';
  import { tweened } from 'svelte/motion';

  const { data, x, y, xDomain, xScale, yScale, xRange, yRange, custom } =
    getContext('LayerCake');

  let groups_all = $custom.groups_all;
  let groups_selected = $custom.groups_selected;
  let groups_to_label = $custom.groups_to_label;
  let index_subset;
  let data_subset;

  $: {
    groups_to_label = $custom.groups_to_label;
    if (groups_to_label) {
      index_subset = groups_all
        .map((item, index) => (groups_to_label.includes(item) ? index : -1))
        .filter((index) => index !== -1);
      data_subset = index_subset.map((index) => $data[index]);
    } else {
      index_subset = null;
      data_subset = null;
    }

    // console.log(`groups_to_label`);
    // console.log(groups_to_label);
    // console.log(`index_subset`);
    // console.log(index_subset);
    // console.log(`data_subset`);
    // console.log(data_subset);
    // console.log(`$xDomain`);
    // console.log(max($xDomain));
  }
  /* --------------------------------------------
   * Title case the first letter
   */
  const cap = (group) => {
    const array = group.map((d) => d.group);

    let uniqueArray = [...new Set(array)];
    let groupKey = uniqueArray.join(', ');
    const result = groupKey.replace(/^\w/, (d) => d.toUpperCase());
    return result;
  };

  /* --------------------------------------------
   * Put the label on the highest value
   */

  $: left = (group) => {
    const x_values_all = group.map((d) => d.year);
    const xMax = max($xDomain);
    const result = $xScale(xMax) / Math.max(...$xRange);
    return result;
  };

  $: top = (group) => {
    const xMax = max($xDomain);
    const y_values_all = group.map((d) => d.value);
    const yMax = Math.max(...y_values_all);
    console.log(`yMax`);
    console.log(yMax);
    const result = $yScale(yMax) / Math.max(...$yRange);
    return result;
  };
</script>

{#if data_subset}
  {#each data_subset as group, i}
    <div
      class="label"
      style="
      top:{top(group) * 100}%;
      left:{left(group) * 100}%;
      font-size: 16px;
      font-weight: 600;
    "
      transition:fade={{ delay: 0, duration: 700 }}
    >
      {cap(group)}
    </div>
  {/each}
{/if}

<style>
  .label {
    position: absolute;
    transform: translate(-100%, -100%) translateY(1px);
    font-size: 13px;
  }
</style>
