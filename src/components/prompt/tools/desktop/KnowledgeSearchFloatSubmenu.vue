<template>
  <button
    class="prompt-tool-child-option prompt-tool-child-option--checkbox tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-control tw-px-2.5 tw-text-left"
    :class="{'is-active': paperActive}"
    type="button"
    role="menuitemcheckbox"
    :aria-checked="paperActive"
    @click="$emit('toggle-option', 'knowledge-paper')"
  >
    <span
      class="prompt-tool-checkbox tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[5px] tw-border tw-border-solid tw-border-app-controlBorder"
      aria-hidden="true"
    >
      <span v-if="paperActive">✓</span>
    </span>
    <p>{{ paperLabel }}</p>
  </button>
  <button
    class="prompt-tool-child-option prompt-tool-child-option--checkbox tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-control tw-px-2.5 tw-text-left"
    :class="{'is-active': confluenceActive}"
    type="button"
    role="menuitemcheckbox"
    :aria-checked="confluenceActive"
    @click="$emit('toggle-option', 'knowledge-confluence')"
  >
    <span
      class="prompt-tool-checkbox tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[5px] tw-border tw-border-solid tw-border-app-controlBorder"
      aria-hidden="true"
    >
      <span v-if="confluenceActive">✓</span>
    </span>
    <p>{{ confluenceLabel }}</p>
  </button>
  <button
    class="prompt-tool-child-option prompt-tool-child-option--checkbox tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-control tw-px-2.5 tw-text-left"
    :class="{'is-active': jiraActive}"
    type="button"
    role="menuitemcheckbox"
    :aria-checked="jiraActive"
    @click="$emit('toggle-option', 'knowledge-jira')"
  >
    <span
      class="prompt-tool-checkbox tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[5px] tw-border tw-border-solid tw-border-app-controlBorder"
      aria-hidden="true"
    >
      <span v-if="jiraActive">✓</span>
    </span>
    <p>{{ jiraLabel }}</p>
  </button>
</template>

<script setup>
defineProps({
  paperLabel: {type: String, required: true},
  confluenceLabel: {type: String, required: true},
  jiraLabel: {type: String, required: true},
  paperActive: {type: Boolean, default: false},
  confluenceActive: {type: Boolean, default: false},
  jiraActive: {type: Boolean, default: false},
});

defineEmits(["toggle-option"]);
</script>
