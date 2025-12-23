<script>
  import { createEventDispatcher } from "svelte";
  import Spinner from "./Spinner.svelte";

  const dispatch = createEventDispatcher();

  export let name = "";
  export let autocomplete = "";
  export let value = "";
  export let placeholder = "";
  export let items = [];
  export let nomatch = false;
  export let isOpen = false;
  export let results = [];
  export let search = value;
  export let arrowCounter = 0;
  export let minChar = 2;
  export let spinner = false;

  let maxItems = 10;
  let fromStart = false; // Default type ahead
  let list;
  let input;

  function focusOnMount(node) {
    node.focus();
  }

  // debounce
  const debounce = (fn, time) => {
    let timeout;
    return function () {
      const functionCall = () => fn.apply(this, arguments);
      clearTimeout(timeout);
      timeout = setTimeout(functionCall, time);
    };
  };

  const regExpEscape = (/** @type {string} */ s) => {
    return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
  };

  $: if (items.length > 0) {
    filterResults();
  }

  /**
   * @param {any} event
   */
  async function onChange(event) {
    if (search.trim().length >= Number(minChar)) {
      isOpen = true;
      debounce((e) => {
        dispatch("query", search);
      }, 200)();
    } else {
      isOpen = false;
    }
  }

  function filterResults() {
    results = items.map((item) => {
      const text = typeof item !== "string" ? item.value : item;
      return {
        value: item.value || item,
        type: item.type,
        label:
          search.trim() === ""
            ? text
            : text.replace(
                RegExp(regExpEscape(search.trim()), "i"),
                "<span class='text-gray-700 font-bold'>$&</span>"
              ),
      };
    });
  }

  /**
   * @param {{ key: string; preventDefault: () => void; }} event
   */
  function onKeyDown(event) {
    if (event.key === "ArrowDown" && arrowCounter < results.length) {
      arrowCounter = arrowCounter + 1;
    } else if (event.key === "ArrowUp" && arrowCounter > 0) {
      arrowCounter = arrowCounter - 1;
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (arrowCounter === -1) {
        arrowCounter = 0; // Default select first item of list
      }
      close(arrowCounter);
    } else if (event.key === "Escape") {
      isOpen = false;
    }
  }

  function close(index = -1) {
    isOpen = false;
    arrowCounter = -1;

    if (index > -1) {
      input.blur();
      value = results[index].value;
      search = value;
      dispatch("hit", items[index]);
    } else if (!value) {
      isOpen = false;
    }
  }
</script>

<svelte:window on:click={() => close()} />

<div class="relative">
  <!-- New: Instructional text element -->
  <div id="autocomplete-instructions" class="sr-only">
    Type at least {minChar} characters to search. Use the down and up arrow keys to navigate search results, and press Enter to select a result.
  </div>

  <input
    name="{name}"
    class="appearance-none bg-transparent border-b-4 border-orange-400 dark:border-orange-600 focus:border-orange-500 w-full text-xl md:text-3xl text-gray-900 dark:text-gray-200 mr-3 py-1 px-2 leading-tight focus:outline-none transition-colors duration-200 ease-in-out"
    type="text"
    role="combobox"
    onfocus="this.select()"
    autocomplete="{autocomplete}" 
    {placeholder}
    aria-expanded={isOpen}
    aria-controls="autocomplete-list"
    aria-activedescendant={isOpen && arrowCounter > -1 && results.length > arrowCounter
      ? `result-${arrowCounter}`
      : undefined}
    aria-label="search for an address or a place"
    aria-describedby="autocomplete-instructions"
    bind:value={search}
    on:input={(event) => onChange(event)}
    on:keydown={(event) => onKeyDown(event)}
    bind:this={input}
    use:focusOnMount
  />


  {#if spinner}
    <Spinner position="top: 10px; right: 34px;" />
  {/if}

  <!-- Add a visually hidden title near your component -->
  <div id="listbox-title" class="sr-only">Search Results</div>
  <ul
    class="autocomplete-results {!isOpen
      ? 'hidden'
      : ''} w-full border-gray-500 shadow-md bg-white absolute max-h-screen overflow-y-auto overflow-x-hidden z-50"
    id="autocomplete-list"
    role="listbox"
    bind:this={list}
    aria-label="Autocomplete search results"
  >
    {#if !nomatch}
      {#each results as result, i}
        <li
          id={`result-${i}`}
          role="option"
          aria-selected={i === arrowCounter}
          on:click={() => close(i)}
          on:keydown={() => close(i)}
          class="autocomplete-result {i === arrowCounter
            ? ' is-active'
            : ''}  text-gray-700 py-1 px-2 cursor-pointer"
        >
          <span
            class="bg-sky-700 px-2 py-1 text-white font-bold rounded-sm text-sm"
            >{result.type}</span
          >
          <span>{@html result.label}</span>
        </li>
      {/each}
    {:else}
      <li class="autocomplete-nomatch">No matches found.</li>
    {/if}
  </ul>
</div>

<style>
  .autocomplete-results {
    top: 50px;
    max-height: 100vh;
  }

  .autocomplete-nomatch {
    @apply text-gray-700 font-semibold py-1 px-2;
  }

  .autocomplete-result.is-active,
  .autocomplete-result:hover {
    @apply bg-orange-200;
  }
</style>
