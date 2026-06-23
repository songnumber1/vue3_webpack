<template>
  <button
    class="bottom-sheet-option bottom-sheet-option--row bottom-sheet-option--choice bottom-sheet-option--selectedRow tw-flex tw-w-full tw-items-center tw-gap-3 tw-text-left"
    :class="{'is-active': selectedEngine === 'web-perplexity'}"
    type="button"
    role="menuitemradio"
    :aria-checked="selectedEngine === 'web-perplexity'"
    @click="$emit('select-engine', 'web-perplexity')"
  >
    <span
      class="bottom-sheet-radio tw-inline-flex tw-h-[22px] tw-w-[22px] tw-min-w-[22px] tw-flex-[0_0_22px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-app-controlBorder"
      :class="{'is-selected': selectedEngine === 'web-perplexity'}"
      aria-hidden="true"
    >
      <span
        v-if="selectedEngine === 'web-perplexity'"
        class="bottom-sheet-radio-dot"
      ></span>
    </span>
    <strong>{{ perplexityLabel }}</strong>
    <span
      v-if="selectedEngine === 'web-perplexity'"
      class="bottom-sheet-selected-check"
      aria-hidden="true"
      >✓</span
    >
  </button>
  <button
    class="bottom-sheet-option bottom-sheet-option--row bottom-sheet-option--choice bottom-sheet-option--selectedRow tw-flex tw-w-full tw-items-center tw-gap-3 tw-text-left"
    :class="{'is-active': selectedEngine === 'web-google-ai-overviews'}"
    type="button"
    role="menuitemradio"
    :aria-checked="selectedEngine === 'web-google-ai-overviews'"
    @click="$emit('select-engine', 'web-google-ai-overviews')"
  >
    <span
      class="bottom-sheet-radio tw-inline-flex tw-h-[22px] tw-w-[22px] tw-min-w-[22px] tw-flex-[0_0_22px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-app-controlBorder"
      :class="{'is-selected': selectedEngine === 'web-google-ai-overviews'}"
      aria-hidden="true"
    >
      <span
        v-if="selectedEngine === 'web-google-ai-overviews'"
        class="bottom-sheet-radio-dot"
      ></span>
    </span>
    <strong>{{ googleAiOverviewsLabel }}</strong>
    <span
      v-if="selectedEngine === 'web-google-ai-overviews'"
      class="bottom-sheet-selected-check"
      aria-hidden="true"
      >✓</span
    >
  </button>
  <button
    class="bottom-sheet-option bottom-sheet-option--row bottom-sheet-option--choice bottom-sheet-option--selectedRow tw-flex tw-w-full tw-items-center tw-gap-3 tw-text-left"
    :class="{'is-active': selectedEngine === 'web-chatgpt-search'}"
    type="button"
    role="menuitemradio"
    :aria-checked="selectedEngine === 'web-chatgpt-search'"
    @click="$emit('select-engine', 'web-chatgpt-search')"
  >
    <span
      class="bottom-sheet-radio tw-inline-flex tw-h-[22px] tw-w-[22px] tw-min-w-[22px] tw-flex-[0_0_22px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-app-controlBorder"
      :class="{'is-selected': selectedEngine === 'web-chatgpt-search'}"
      aria-hidden="true"
    >
      <span
        v-if="selectedEngine === 'web-chatgpt-search'"
        class="bottom-sheet-radio-dot"
      ></span>
    </span>
    <strong>{{ chatgptSearchLabel }}</strong>
    <span
      v-if="selectedEngine === 'web-chatgpt-search'"
      class="bottom-sheet-selected-check"
      aria-hidden="true"
      >✓</span
    >
  </button>
  <button
    class="bottom-sheet-option bottom-sheet-option--row bottom-sheet-option--choice bottom-sheet-option--selectedRow tw-flex tw-w-full tw-items-center tw-gap-3 tw-text-left"
    :class="{'is-active': selectedEngine === 'web-microsoft-copilot'}"
    type="button"
    role="menuitemradio"
    :aria-checked="selectedEngine === 'web-microsoft-copilot'"
    @click="$emit('select-engine', 'web-microsoft-copilot')"
  >
    <span
      class="bottom-sheet-radio tw-inline-flex tw-h-[22px] tw-w-[22px] tw-min-w-[22px] tw-flex-[0_0_22px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-app-controlBorder"
      :class="{'is-selected': selectedEngine === 'web-microsoft-copilot'}"
      aria-hidden="true"
    >
      <span
        v-if="selectedEngine === 'web-microsoft-copilot'"
        class="bottom-sheet-radio-dot"
      ></span>
    </span>
    <strong>{{ microsoftCopilotLabel }}</strong>
    <span
      v-if="selectedEngine === 'web-microsoft-copilot'"
      class="bottom-sheet-selected-check"
      aria-hidden="true"
      >✓</span
    >
  </button>
</template>

<script setup>
defineProps({
  perplexityLabel: {type: String, required: true},
  googleAiOverviewsLabel: {type: String, required: true},
  chatgptSearchLabel: {type: String, required: true},
  microsoftCopilotLabel: {type: String, required: true},
  selectedEngine: {type: String, default: ""},
});

defineEmits(["select-engine"]);
</script>
