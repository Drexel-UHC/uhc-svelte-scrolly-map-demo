<script>
  import { themes } from '../config.js';
  import { getContext } from 'svelte';
  import Icon from '@iconify/svelte';
  export let theme = getContext('theme');
</script>

<footer
  style="color: {themes[theme]['text']}; background-color: {themes[theme][
    'pale'
  ]};"
>
  <div class="col-wide" data-analytics="footer">
    <div class="container">
      <div class="item">
        <a href="https://drexel.edu/uhc/">
          <div id="svg-container">
            <img
              id="my-svg"
              src="./img/uhc-primary-blue_black.svg"
              alt="Drexel Urban Health Collaborative"
            />
          </div>
        </a>
        <div class="link-tree">
          <ul>
            <li>
              <a
                href="https://drexel.edu/uhc/about/contact/"
                class="link"
                style="color: {themes[theme]['text']}">Contact us</a
              >
            </li>

            <li>
              <a
                href="https://drexel.edu/privacy"
                class="link"
                style="color: {themes[theme]['text']}">Privacy and legal</a
              >
            </li>
          </ul>
        </div>
      </div>
      <div class="item" id="follow-uhc">
        Follow UHC:
        <div class="container">
          <a href="https://github.com/Drexel-UHC">
            <div class="social-icon"><Icon icon="mdi:github" /></div>
          </a>
          <a href="https://www.facebook.com/DrexelUHC/">
            <div class="social-icon"><Icon icon="il:facebook" /></div>
          </a>
          <a href="https://twitter.com/drexeluhc">
            <div class="social-icon"><Icon icon="mdi:twitter" /></div>
          </a>
          <a href="https://www.instagram.com/drexeluhc">
            <div class="social-icon"><Icon icon="mdi:instagram" /></div>
          </a>
          <a href="https://www.youtube.com/@urbanhealthcollaborative8928">
            <div class="social-icon"><Icon icon="mdi:youtube" /></div>
          </a>
          <a
            href="https://www.linkedin.com/company/drexel-urban-health-collaborative/"
          >
            <div class="social-icon"><Icon icon="mdi:linkedin" /></div>
          </a>
        </div>
      </div>
    </div>
    <hr style="border-top-color: {themes[theme]['muted']}" />
    <div class="license">
      This template was forked and modified from the <a
        href="https://github.com/ONSvisual/svelte-scrolly"
        class="link"
        target="_blank"
        rel="noopener"
        style="color: {themes[theme]['text']}"
        >UK Office of National Statistics</a
      >. All content is available under the
      <a
        href="https://opensource.org/licenses/MIT"
        class="link"
        target="_blank"
        rel="noopener"
        style="color: {themes[theme]['text']}">MIT License</a
      >, except where otherwise stated
    </div>
  </div>
</footer>

<style>
  .container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  #follow-uhc {
    min-width: 200px;
  }
  .item {
  }
  .social-icon {
    font-size: 1.5rem;
  }
  footer {
    padding-bottom: 72px;
    padding-top: 36px;
    font-size: 18px;
  }
  #svg-container {
    width: 200px; /* Set the desired width of the container */
    height: 80px; /* Set the desired height of the container */
  }
  .link-tree {
    margin-top: 27px;
  }
  footer a.link {
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    text-decoration: underline;
    display: inline-block;
  }
  footer a.link:hover {
    text-decoration: none;
  }
  footer a.link:active {
    outline: 3px solid transparent;
    background-color: #fd0;
    -webkit-box-shadow: 0 -2px #fd0, 0 4px #222;
    box-shadow: 0 -2px #fd0, 0 4px #222;
    color: #222;
    text-decoration: none;
  }
  footer hr {
    margin-bottom: 27px;
    margin-top: 36px;
    border: none;
    border-top: 1px solid #777;
  }
  ul {
    padding: 0;
    margin: 0;
  }
  li {
    margin-right: 18px;
    display: inline-block;
  }
  .logo-img {
    margin-bottom: 27px;
  }
  .ogl-img {
    margin: 0 0.5rem 0.2rem 0;
    width: 59px;
    height: 24px;
    vertical-align: middle;
  }
  .license {
    vertical-align: top;
  }
  a img:hover {
    cursor: pointer;
  }
</style>
