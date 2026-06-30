<template>
  <BaseBottomSheet
    :open="Boolean(group)"
    :title="group?.label || ''"
    @close="promptInputActions.closeTemplateOptionSheet?.()"
  >
    <button
      v-for="option in group?.options || []"
      :key="option.tag"
      class="bottom-sheet-option bottom-sheet-option--row prompt-template-sheet-option"
      :class="{'is-active': option.active}"
      type="button"
      @click="promptInputActions.selectTemplateOption?.(group.id, option.tag)"
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
import {computed, unref} from "vue";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import {usePromptInputActions} from "@/composables/prompt/context/promptInputActionContext";
import {usePromptInputState} from "@/composables/prompt/context/promptInputStateContext";

const promptInputActions = usePromptInputActions();
const promptInputState = usePromptInputState();
const group = computed(() => unref(promptInputState.activeMobileGroup) || null);
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
