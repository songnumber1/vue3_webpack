<template>
  <button
    class="bottom-sheet-option bottom-sheet-option--row tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-text-left"
    :class="{'is-active': active}"
    type="button"
    @click="$emit('open-group')"
  >
    <span aria-hidden="true">⌕</span>
    <span class="bottom-sheet-option-main tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-start tw-text-left">
      <strong>{{ label }}</strong>
    </span>
    <span
      v-if="activeCount > 0"
      class="bottom-sheet-active-badge tw-ml-auto tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full"
      aria-hidden="true"
    >
      {{ activeCount }}
    </span>
    <span class="bottom-sheet-submenu-arrow tw-ml-auto tw-shrink-0" aria-hidden="true">›</span>
  </button>
</template>

<script setup>
defineProps({
  label: {type: String, required: true},
  active: {type: Boolean, default: false},
  activeCount: {type: Number, default: 0},
});

defineEmits(["open-group"]);
</script>
