<template>
  <button
    class="bottom-sheet-option bottom-sheet-option--row tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-text-left"
    :class="{'is-active': active}"
    type="button"
    @click="$emit('open-group')"
  >
    <span aria-hidden="true">◉</span>
    <span class="bottom-sheet-option-main tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-start tw-text-left">
      <strong>{{ label }}</strong>
    </span>
    <span
      class="bottom-sheet-parent-switch tw-ml-auto tw-shrink-0 tw-rounded-full"
      :class="{'is-active': active}"
      role="switch"
      tabindex="0"
      :aria-pressed="active"
      :aria-label="label"
      @click.stop="$emit('toggle-enabled')"
      @keydown.enter.stop.prevent="$emit('toggle-enabled')"
      @keydown.space.stop.prevent="$emit('toggle-enabled')"
    >
      <span aria-hidden="true"></span>
    </span>
    <span class="bottom-sheet-submenu-arrow tw-ml-auto tw-shrink-0" aria-hidden="true">›</span>
  </button>
</template>

<script setup>
defineProps({
  label: {type: String, required: true},
  active: {type: Boolean, default: false},
});

defineEmits(["open-group", "toggle-enabled"]);
</script>
