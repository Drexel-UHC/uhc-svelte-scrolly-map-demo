<!-- 
# ============================================================================ #
# <script>
 -->
<script>
  import MyChart from './components/layer-cake/MyChart.svelte';

  let selection = {
    options: ['apples', 'bananas', 'cherries', 'dates'],
    selected: ['apples'],
  };

  function toggleSelection(option) {
    const index = selection.selected.indexOf(option);
    if (index >= 0) {
      // Option is currently selected, so remove it from the array
      selection.selected = [
        ...selection.selected.slice(0, index),
        ...selection.selected.slice(index + 1),
      ];
    } else {
      // Option is not currently selected, so add it to the array
      selection.selected = [...selection.selected, option];
    }
  }
</script>

<!-- 
# ============================================================================ #
# <markup>
 -->

<div class="controls small">
  {#each selection.options as option (option)}
    <label>
      <input
        type="checkbox"
        checked={selection.selected.includes(option)}
        on:change={() => toggleSelection(option)}
      />
      {option}
    </label>
  {/each}
</div>
<MyChart {selection} />

<!-- 
# ============================================================================ #
# <style>
 -->

<style>
  .controls > label {
    display: inline;
    margin-right: 8px;
  }
  .small {
    font-size: 0.8em;
  }
  .stickDev {
    position: fixed;
    bottom: 100;
    right: 0;
    background-color: white;
    padding: 10px;
  }
</style>
