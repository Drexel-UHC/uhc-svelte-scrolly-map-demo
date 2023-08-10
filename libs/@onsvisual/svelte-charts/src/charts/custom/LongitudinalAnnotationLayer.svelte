<script>
  import { getContext } from 'svelte';
  import { fade } from 'svelte/transition';

  const { data, x, y, xDomain, xScale, yScale, xRange, yRange, custom } =
    getContext('LayerCake');

  $: show_longitudinal_annotation_layer = $custom.longitudinal_annotation_layer;
</script>

{#if show_longitudinal_annotation_layer}
  <div
    class="label"
    style="  
      left: 0%; 
      width: 46%;
      height: 100%;
      background-color: green; 
      opacity:0.3;
    "
    transition:fade={{ delay: 0, duration: 300 }}
  />
  <div
    class="label"
    style="  
      left: 46%; 
      width: 30%;
      height: 100%;
      background-color: yellow; 
      opacity:0.3;
    "
    transition:fade={{ delay: 0, duration: 300 }}
  />
  <div
    class="label"
    style="  
      left: 76%; 
      width: 24%;
      height: 100%;
      background-color: red; 
      opacity:0.3;
    "
    transition:fade={{ delay: 0, duration: 300 }}
  />
{/if}

<style>
  .label {
    position: absolute;
    /* transform: translate(-0%, -0%) translateY(1px); */
  }
</style>
