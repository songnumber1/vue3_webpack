<template>
  <button
    type="button"
    class="prompt-tool-menu-parent tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-rounded-control tw-px-2.5 tw-text-left"
    :class="{active: expanded || active}"
    aria-haspopup="menu"
    :aria-expanded="expanded"
    @click="$emit('toggle-group')"
  >
    <span class="prompt-tool-icon tw-shrink-0" aria-hidden="true">⌕</span>
    <span class="prompt-tool-text tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-text-left">
      <strong>{{ label }}</strong>
    </span>
    <span
      v-if="active"
      class="prompt-menu-active-badge tw-ml-auto tw-inline-flex tw-items-center tw-justify-center tw-rounded-full"
      aria-hidden="true"
    >
      {{ activeCount }}
    </span>
    <span class="prompt-submenu-arrow tw-ml-auto tw-shrink-0" aria-hidden="true">›</span>
  </button>
</template>

<script setup>
defineProps({
  label: {type: String, required: true},
  active: {type: Boolean, default: false},
  activeCount: {type: Number, default: 0},
  expanded: {type: Boolean, default: false},
});

defineEmits(["toggle-group"]);
</script>
