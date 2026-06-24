<template>
  <BaseBottomSheet
    :open="Boolean(group)"
    :title="group?.label || ''"
    @close="$emit('close')"
  >
    <button
      v-for="option in group?.options || []"
      :key="option.tag"
      class="bottom-sheet-option bottom-sheet-option--row prompt-template-sheet-option"
      :class="{'is-active': option.active}"
      type="button"
      @click="$emit('select-option', group.id, option.tag)"
    >
      <strong>{{ option.label }}</strong>
      <span
        v-if="option.active"
        class="prompt-template-sheet-check"
        aria-hidden="true"
        >✓</span
      >
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";

defineProps({
  group: {type: Object, default: null},
});

defineEmits(["select-option", "close"]);
</script>

<style scoped lang="scss">
.prompt-template-sheet-option {
  justify-content: flex-start;
  text-align: left;
  border: 1px solid transparent;
}

.prompt-template-sheet-option strong {
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
}

.prompt-template-sheet-option.is-active {
  border-color: color-mix(in srgb, var(--accent) 48%, var(--control-border));
  background: color-mix(in srgb, var(--accent) 10%, var(--control-hover));
  color: var(--text);
}

.prompt-template-sheet-check {
  width: auto !important;
  min-width: 20px !important;
  flex: 0 0 auto !important;
  margin-left: auto;
  color: var(--accent);
  font-size: var(--font-size-md) !important;
  font-weight: 900;
  text-align: right !important;
}
</style>
