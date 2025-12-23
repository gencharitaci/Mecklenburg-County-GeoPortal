<script>
  import sparkline from "../js/sparkline.js"

  export let data
  //export let label

  let isVisible = data.length > 0

  let svgElement


  const options = {
    /**
     * @param {{ target: any; offsetY: number; offsetX: number; }} event
     * @param {{ label: any; }} datapoint
     */
    onmousemove(event, datapoint) {
      var svg = findClosest(event.target, "svg");
      var tooltip = svg.nextElementSibling;

      tooltip.hidden = false;
      tooltip.textContent = datapoint.label
      tooltip.style.top = `${event.offsetY - 10}px`;
      tooltip.style.left = `${event.offsetX + 20}px`;
    },

    /**
     * @param {{ target: any; }} event
     */
    onmouseout(event) {
      var svg = findClosest(event.target, "svg");
      var tooltip = svg.nextElementSibling;

      tooltip.hidden = true;
    }
  }
  

  function findClosest(target, tagName) {
    if (target.tagName === tagName) {
      return target;
    }

    while ((target = target.parentNode)) {
      if (target.tagName === tagName) {
        break;
      }
    }

    return target;
  }

   $: makeSparkline(data, svgElement)


   /**
   * @param {any[]} x
   * @param {{ querySelectorAll: any; removeChild: any; attributes?: any; appendChild?: any; }} elem
   */
   function makeSparkline(x, elem) {
    if (elem) {
      sparkline(elem, x, options)
    }
   }


</script>

<style>
.tooltip {
  @apply absolute shadow px-2 py-1 rounded bg-white dark:text-black text-sm whitespace-nowrap z-0;
}
</style>

{#if isVisible}
<div class="relative inline-block">
  <svg aria-hidden="true" tabindex="-1" bind:this={svgElement} class="inline" width="100" height="20" stroke-width="2" stroke="#2C5282" fill="#90CDF4"></svg>
  <span class="tooltip" hidden></span>
</div>
{/if}
