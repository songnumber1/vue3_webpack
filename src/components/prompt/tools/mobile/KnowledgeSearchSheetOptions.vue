<template>
  <button
    class="bottom-sheet-option bottom-sheet-option--row bottom-sheet-option--choice bottom-sheet-option--checkbox tw-flex tw-w-full tw-items-center tw-gap-3 tw-text-left"
    :class="{'is-active': paperActive}"
    type="button"
    role="menuitemcheckbox"
    :aria-checked="paperActive"
    @click="$emit('toggle-option', 'knowledge-paper')"
  >
    <span
      class="bottom-sheet-checkbox tw-inline-flex tw-h-[22px] tw-w-[22px] tw-min-w-[22px] tw-flex-[0_0_22px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[5px] tw-border tw-border-solid tw-border-app-controlBorder"
      :class="{'is-checked': paperActive}"
      aria-hidden="true"
    >
      <span v-if="paperActive" class="bottom-sheet-checkbox-mark">✓</span>
    </span>
    <strong>{{ paperLabel }}</strong>
  </button>
  <button
    class="bottom-sheet-option bottom-sheet-option--row bottom-sheet-option--choice bottom-sheet-option--checkbox tw-flex tw-w-full tw-items-center tw-gap-3 tw-text-left"
    :class="{'is-active': confluenceActive}"
    type="button"
    role="menuitemcheckbox"
    :aria-checked="confluenceActive"
    @click="$emit('toggle-option', 'knowledge-confluence')"
  >
    <span
      class="bottom-sheet-checkbox tw-inline-flex tw-h-[22px] tw-w-[22px] tw-min-w-[22px] tw-flex-[0_0_22px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[5px] tw-border tw-border-solid tw-border-app-controlBorder"
      :class="{'is-checked': confluenceActive}"
      aria-hidden="true"
    >
      <span v-if="confluenceActive" class="bottom-sheet-checkbox-mark">✓</span>
    </span>
    <strong>{{ confluenceLabel }}</strong>
  </button>
  <button
    class="bottom-sheet-option bottom-sheet-option--row bottom-sheet-option--choice bottom-sheet-option--checkbox tw-flex tw-w-full tw-items-center tw-gap-3 tw-text-left"
    :class="{'is-active': jiraActive}"
    type="button"
    role="menuitemcheckbox"
    :aria-checked="jiraActive"
    @click="$emit('toggle-option', 'knowledge-jira')"
  >
    <span
      class="bottom-sheet-checkbox tw-inline-flex tw-h-[22px] tw-w-[22px] tw-min-w-[22px] tw-flex-[0_0_22px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[5px] tw-border tw-border-solid tw-border-app-controlBorder"
      :class="{'is-checked': jiraActive}"
      aria-hidden="true"
    >
      <span v-if="jiraActive" class="bottom-sheet-checkbox-mark">✓</span>
    </span>
    <strong>{{ jiraLabel }}</strong>
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
