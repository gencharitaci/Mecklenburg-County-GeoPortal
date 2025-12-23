<script>
  let tutorialIframe;

  function loadVideo(event) {
    const embedId = event.currentTarget.dataset.embed;
    // Set a meaningful title dynamically when loading the video
    tutorialIframe.setAttribute(
      "title",
      "GeoPortal video tutorial - Now Playing"
    );
    tutorialIframe.setAttribute(
      "src",
      `https://www.youtube.com/embed/${embedId}?autoplay=1`
    );
    tutorialIframe.classList.remove("hidden");
  }
</script>

<div class="video-player-container w-full h-full">
  <!-- Accessible Play Button -->
  <div
    role="button"
    tabindex="0"
    aria-label="Play tutorial video"
    class="play-button"
    data-embed="agzk5yeHafg"
    on:click={loadVideo}
    on:keypress={loadVideo}
    on:keydown={(e) => (e.key === "Enter" || e.key === " ") && loadVideo(e)}
  >
    <span class="visually-hidden hidden">Play tutorial video</span>
  </div>

  <!-- Video Iframe -->
  <iframe
    bind:this={tutorialIframe}
    class="video-iframe absolute hidden w-full h-full z-20"
    frameborder="0"
    title="GeoPortal video tutorial"
    allow="autoplay; encrypted-media"
    allowfullscreen
  ></iframe>
</div>

<style>
  .play-button {
    width: 90px;
    height: 60px;
    @apply bg-sky-500 shadow-sky-500/50 cursor-pointer shadow-lg z-10 rounded-lg transition duration-300 ease-in-out;
  }
  .play-button:hover {
    @apply bg-red-700 shadow-red-700/50;
  }
  .play-button:before {
    content: "";
    border-style: solid;
    border-width: 15px 0 15px 26px;
    border-color: transparent transparent transparent #fff;
    margin-left: 3px;
  }
  .play-button,
  .play-button:before {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);
  }
  .play-button:focus,
  .play-button:focus-visible {
    outline: 2px solid #000; 
    outline-offset: 2px; 
  }
</style>
