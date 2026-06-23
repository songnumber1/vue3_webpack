<template>
  <button
    type="button"
    class="prompt-tool-menu-parent tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-rounded-control tw-px-2.5 tw-text-left"
    :class="{active: expanded || active}"
    aria-haspopup="menu"
    :aria-expanded="expanded"
    @click="$emit('toggle-group')"
  >
    <span class="prompt-tool-icon tw-shrink-0" aria-hidden="true">◉</span>
    <span
      class="prompt-tool-text tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-text-left"
    >
      <strong>{{ label }}</strong>
    </span>
    <span
      class="prompt-tool-parent-switch tw-ml-auto tw-shrink-0 tw-rounded-full"
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
    <span class="prompt-submenu-arrow tw-ml-auto tw-shrink-0" aria-hidden="true"
      >›</span
    >
  </button>
</template>

<script setup>
defineProps({
  label: {type: String, required: true},
  active: {type: Boolean, default: false},
  expanded: {type: Boolean, default: false},
});

defineEmits(["toggle-group", "toggle-enabled"]);
</script>
