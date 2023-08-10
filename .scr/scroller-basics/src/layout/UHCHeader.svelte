<script>
  import { themes } from '../config.js';
  import { getContext } from 'svelte';

  export let theme = getContext('theme');
  export let filled = false;
  export let center = true;
</script>

<nav
  style="border-bottom-color: {themes[theme]['muted']}; {filled
    ? 'background-color: ' + themes[theme]['background'] + ';'
    : ''}"
>
  <div class="col-wide middle" class:center>
    <a href="https://drexel.edu/uhc/">
      <div id="svg-container">
        <img
          id="my-svg"
          src="./img/uhc-primary-blue_black.svg"
          alt="Drexel Urban Health Collaborative"
        />
      </div>
    </a>
  </div>
</nav>

<style>
  #svg-container {
    width: 200px; /* Set the desired width of the container */
    height: 80px; /* Set the desired height of the container */
  }

  #my-svg {
    width: 100%; /* Make the SVG width fill the container */
    height: 100%; /* Make the SVG height fill the container */
    object-fit: contain; /* Adjust the object-fit property as per your needs */
  }

  nav {
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    position: relative;
    height: 100px;
    margin-bottom: -80px;
    border-bottom: 1px solid #777;
    z-index: 1;
  }
  a img:hover {
    cursor: pointer;
  }
</style>
