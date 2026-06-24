<template>
  <div
    v-if="!isSubmitOnly"
    class="prompt-action-row tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-2"
    :class="{
      'prompt-action-row--top-actions': isTopActionsOnly,
      'prompt-action-row--submit-only': isSubmitOnly,
    }"
    :data-can-submit="!canSubmit ? 'false' : 'true'"
  >
    <div
      v-if="!isSubmitOnly"
      class="prompt-left-actions tw-flex tw-min-w-0 tw-items-center tw-gap-2"
    >
      <PromptModelSelector
        ref="modelSelectorRef"
        :disabled="disabled"
        :model-readonly="modelReadonly"
        :model-value="modelValue"
        :current-model="currentModel"
        :models="models"
        :model-menu-open="modelMenuOpen"
        :is-mobile-sheet="isMobileSheet"
        :model-select-label="modelSelectLabel"
        :readonly-title="resolvedReadonlyTitle"
        @open-model="$emit('open-model')"
        @select-model="$emit('select-model', $event)"
      />

      <div
        v-if="!hideToolActions"
        ref="toolRoot"
        class="prompt-selector-wrap tw-relative tw-min-w-0"
      >
        <button
          v-if="!selectedTemplateTool"
          class="prompt-icon-action tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-transition"
          :class="{'prompt-icon-action--active': toolMenuOpen}"
          type="button"
          :disabled="disabled"
          aria-label="Tools"
          @click="$emit('open-tool')"
        >
          ＋
        </button>
        <button
          v-else
          class="prompt-selected-tool-chip prompt-selected-tool-chip--desktop tw-inline-flex tw-h-8 tw-max-w-[128px] tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-app-controlBorder tw-bg-app-surface tw-px-2.5 tw-text-sm tw-font-bold tw-leading-none"
          :class="{'prompt-selected-tool-chip--active': toolMenuOpen}"
          type="button"
          :disabled="disabled"
          :title="selectedTemplateTool.label"
          :aria-label="selectedTemplateTool.label"
          @click="$emit('open-tool')"
        >
          <img
            v-if="selectedTemplateTool.iconSrc"
            :src="selectedTemplateTool.iconSrc"
            alt=""
            aria-hidden="true"
          />
          <span>{{ selectedTemplateTool.label }}</span>
        </button>
        <PromptToolFloatMenu
          :open="toolMenuOpen && !isMobileSheet"
          :reference-element="toolRoot"
          :model-value="modelValue"
          :is-mobile-sheet="isMobileSheet"
          @close="$emit('close-tool')"
        />
      </div>

      <PromptAttachButton
        v-if="!hideAttachActions"
        ref="attachButtonRef"
        :disabled="disabled"
        :attach-options="attachOptions"
        :attach-menu-open="attachMenuOpen"
        :is-mobile-sheet="isMobileSheet"
        :attach-label="attachLabel"
        @open-attach="$emit('open-attach')"
        @open-file-picker="$emit('open-file-picker', $event)"
      />
    </div>
    <slot v-if="!isTopActionsOnly" name="submit-actions" />
  </div>
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptToolbarDesktop.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 */

import {computed, reactive, ref, toRefs, inject} from "vue";
import {useI18n} from "vue-i18n";
import PromptAttachButton from "@/components/prompt/controls/PromptAttachButton.vue";
import PromptModelSelector from "@/components/prompt/controls/PromptModelSelector.vue";
import PromptToolFloatMenu from "@/components/prompt/tools/desktop/PromptToolFloatMenu.vue";
import {
  PROMPT_TOOLBAR_STATE_KEY,
  createEmptyPromptToolbarState,
} from "@/composables/chat/chatStateContext";

const LAYOUT_MODES = Object.freeze({
  TOP_ACTIONS: "top-actions",
  SUBMIT_ONLY: "submit-only",
});

// -----------------------------------------------------------------------------
// Props and emits
// -----------------------------------------------------------------------------
const componentProps = defineProps({
  layoutMode: {type: String, default: "top-actions"},
});

defineEmits([
  "open-model",
  "open-tool",
  "close-tool",
  "open-attach",
  "select-model",
  "open-file-picker",
]);

const {t} = useI18n();

// -----------------------------------------------------------------------------
// Local refs and floating menu positioning
// -----------------------------------------------------------------------------
const modelSelectorRef = ref(null);
const toolRoot = ref(null);
const attachButtonRef = ref(null);

// -----------------------------------------------------------------------------
// Context-backed toolbar state
// -----------------------------------------------------------------------------
/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const toolbarState = inject(
  PROMPT_TOOLBAR_STATE_KEY,
  computed(createEmptyPromptToolbarState)
);
const props = reactive({
  get disabled() {
    return toolbarState.value.disabled;
  },
  get modelReadonly() {
    return toolbarState.value.modelReadonly;
  },
  get modelValue() {
    return toolbarState.value.modelValue;
  },
  get currentModel() {
    return toolbarState.value.currentModel;
  },
  get models() {
    return toolbarState.value.models;
  },
  get attachOptions() {
    return toolbarState.value.attachOptions;
  },
  get selectedTemplateTool() {
    return toolbarState.value.selectedTemplateTool;
  },
  get modelMenuOpen() {
    return toolbarState.value.modelMenuOpen;
  },
  get toolMenuOpen() {
    return toolbarState.value.toolMenuOpen;
  },
  get attachMenuOpen() {
    return toolbarState.value.attachMenuOpen;
  },
  get isMobileSheet() {
    return toolbarState.value.isMobileSheet;
  },
  get hideToolActions() {
    return toolbarState.value.hideToolActions;
  },
  get hideAttachActions() {
    return toolbarState.value.hideAttachActions;
  },
  get attachLabel() {
    return toolbarState.value.attachLabel;
  },
  get modelSelectLabel() {
    return toolbarState.value.modelSelectLabel;
  },
  get readonlyTitle() {
    return toolbarState.value.readonlyTitle;
  },
  get canSubmit() {
    return toolbarState.value.canSubmit;
  },
});
const {
  disabled,
  modelReadonly,
  modelValue,
  currentModel,
  models,
  attachOptions,
  modelMenuOpen,
  toolMenuOpen,
  attachMenuOpen,
  isMobileSheet,
  selectedTemplateTool,
  hideToolActions,
  hideAttachActions,
  attachLabel,
  modelSelectLabel,
  canSubmit,
} = toRefs(props);

// -----------------------------------------------------------------------------
// Computed state
// -----------------------------------------------------------------------------
const isSubmitOnly = computed(
  () => componentProps.layoutMode === LAYOUT_MODES.SUBMIT_ONLY
);
const isTopActionsOnly = computed(
  () => componentProps.layoutMode === LAYOUT_MODES.TOP_ACTIONS
);
const resolvedReadonlyTitle = computed(
  () => props.readonlyTitle || t("prompt.modelReadonly")
);

const modelRoot = computed(
  () =>
    modelSelectorRef.value?.modelRoot?.value ||
    modelSelectorRef.value?.modelRoot ||
    null
);
const attachRoot = computed(
  () =>
    attachButtonRef.value?.attachRoot?.value ||
    attachButtonRef.value?.attachRoot ||
    null
);

// -----------------------------------------------------------------------------
// Public component contract
// -----------------------------------------------------------------------------
defineExpose({modelRoot, toolRoot, attachRoot});
</script>

<style scoped lang="scss">
.prompt-action-row {
  min-width: 0;
}

.prompt-action-row--top-actions {
  justify-content: flex-start;
}

.prompt-left-actions {
  min-width: 0;
}

.prompt-selector-wrap {
  min-width: 0;
}

.prompt-popover {
  box-sizing: border-box;
}

.prompt-tool-menu-parent {
  position: relative;
}

.prompt-tool-menu-parent.active {
  background: var(--control-hover);
}

.prompt-submenu-arrow {
  margin-left: auto;
  width: auto;
  color: var(--muted);
  font-size: var(--font-size-lg);
  line-height: 1;
}

.prompt-tool-submenu {
  top: 0;
  bottom: auto;
  min-width: 220px;
}

.prompt-tool-submenu--right {
  left: calc(100% + 8px);
  right: auto;
}

.prompt-tool-submenu--left {
  right: calc(100% + 8px);
  left: auto;
}

.prompt-floating-menu {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  z-index: var(--z-popover);
}

.prompt-menu-active-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  margin-left: auto;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.prompt-menu-active-badge + .prompt-submenu-arrow,
.prompt-tool-parent-switch + .prompt-submenu-arrow {
  margin-left: 6px;
}

.prompt-tool-parent-switch {
  appearance: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  position: relative;
  width: 34px;
  height: 20px;
  min-width: 34px;
  margin-left: auto;
  border-radius: 999px;
  background: var(--control-border);
  transition: background 0.18s ease;
}

.prompt-tool-parent-switch span {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.16);
  transition: transform 0.18s ease;
}

.prompt-tool-parent-switch.is-active {
  background: var(--accent);
}

.prompt-tool-parent-switch.is-active span {
  transform: translateX(14px);
}

.prompt-tool-child-option {
  gap: 12px;
  min-height: 44px;
}

.prompt-tool-child-option p {
  flex: 1;
  min-width: 0;
}

.prompt-tool-child-option--selectedRow.is-active {
  background: color-mix(in srgb, var(--accent) 10%, var(--control-hover));
  color: var(--text);
}

.prompt-tool-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  min-width: 18px;
  border: 1px solid var(--control-border);
  border-radius: 5px;
  background: var(--surface);
  color: var(--surface);
  font-size: var(--font-size-fixed-12);
  font-weight: 800;
  line-height: 1;
}

.prompt-tool-child-option.is-active .prompt-tool-checkbox {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--surface);
}

.prompt-tool-parent-switch > span {
  min-width: 14px;
  flex: 0 0 14px;
  text-align: initial;
  font-size: 0;
}

.prompt-tool-child-option--selectedRow.is-active {
  background: var(--control-hover);
}

.prompt-tool-menu button.is-template-tool {
  min-height: 38px;
  padding: 7px 10px;
  border: 0;
  border-radius: 5px;
}

.prompt-tool-menu button.is-template-tool + button.is-template-tool {
  margin-top: 4px;
}

.prompt-tool-menu button.is-template-tool.active {
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
  color: var(--text);
  box-shadow: none;
}

.prompt-tool-icon {
  width: 24px !important;
  text-align: center;
}

.prompt-tool-dot {
  display: none;
}

.prompt-tool-text {
  display: flex;
  width: auto !important;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.prompt-tool-menu button.is-template-tool .prompt-tool-text small {
  display: none;
}

.prompt-tool-text strong,
.prompt-tool-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-tool-text strong {
  font-size: var(--font-size-md);
  font-weight: 900;
  line-height: 1.2;
}

.prompt-tool-text small {
  color: var(--muted);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.2;
}

.prompt-tool-menu button.is-template-tool.active .prompt-tool-text small {
  color: var(--muted);
}

.prompt-selected-tool-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  max-width: 128px;
  padding: 0 10px;
  border: 1px solid var(--control-border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.prompt-selected-tool-chip--active {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--control-border));
  color: var(--accent);
}

.prompt-selected-tool-chip:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.prompt-selected-tool-chip img,
.prompt-tool-icon-img {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  object-fit: contain;
}

.prompt-selected-tool-chip span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
