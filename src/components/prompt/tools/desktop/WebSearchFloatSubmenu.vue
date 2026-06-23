<template>
  <button
    class="prompt-tool-child-option prompt-tool-child-option--selectedRow tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-control tw-px-2.5 tw-text-left"
    :class="{'is-active': selectedEngine === 'web-perplexity'}"
    type="button"
    role="menuitemradio"
    :aria-checked="selectedEngine === 'web-perplexity'"
    @click="$emit('select-engine', 'web-perplexity')"
  >
    <span
      class="prompt-tool-radio"
      :class="{'is-selected': selectedEngine === 'web-perplexity'}"
      aria-hidden="true"
    >
      <span v-if="selectedEngine === 'web-perplexity'"></span>
    </span>
    <p>{{ perplexityLabel }}</p>
  </button>
  <button
    class="prompt-tool-child-option prompt-tool-child-option--selectedRow tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-control tw-px-2.5 tw-text-left"
    :class="{'is-active': selectedEngine === 'web-google-ai-overviews'}"
    type="button"
    role="menuitemradio"
    :aria-checked="selectedEngine === 'web-google-ai-overviews'"
    @click="$emit('select-engine', 'web-google-ai-overviews')"
  >
    <span
      class="prompt-tool-radio"
      :class="{'is-selected': selectedEngine === 'web-google-ai-overviews'}"
      aria-hidden="true"
    >
      <span v-if="selectedEngine === 'web-google-ai-overviews'"></span>
    </span>
    <p>{{ googleAiOverviewsLabel }}</p>
  </button>
  <button
    class="prompt-tool-child-option prompt-tool-child-option--selectedRow tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-control tw-px-2.5 tw-text-left"
    :class="{'is-active': selectedEngine === 'web-chatgpt-search'}"
    type="button"
    role="menuitemradio"
    :aria-checked="selectedEngine === 'web-chatgpt-search'"
    @click="$emit('select-engine', 'web-chatgpt-search')"
  >
    <span
      class="prompt-tool-radio"
      :class="{'is-selected': selectedEngine === 'web-chatgpt-search'}"
      aria-hidden="true"
    >
      <span v-if="selectedEngine === 'web-chatgpt-search'"></span>
    </span>
    <p>{{ chatgptSearchLabel }}</p>
  </button>
  <button
    class="prompt-tool-child-option prompt-tool-child-option--selectedRow tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-control tw-px-2.5 tw-text-left"
    :class="{'is-active': selectedEngine === 'web-microsoft-copilot'}"
    type="button"
    role="menuitemradio"
    :aria-checked="selectedEngine === 'web-microsoft-copilot'"
    @click="$emit('select-engine', 'web-microsoft-copilot')"
  >
    <span
      class="prompt-tool-radio"
      :class="{'is-selected': selectedEngine === 'web-microsoft-copilot'}"
      aria-hidden="true"
    >
      <span v-if="selectedEngine === 'web-microsoft-copilot'"></span>
    </span>
    <p>{{ microsoftCopilotLabel }}</p>
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
