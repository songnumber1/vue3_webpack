<template>
  <div
    class="prompt-action-row tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-2"
  >
    <div
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

      <div ref="toolRoot" class="prompt-selector-wrap tw-relative tw-min-w-0">
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
        <div
          v-if="toolMenuOpen && !isMobileSheet"
          ref="toolMenuRef"
          class="prompt-popover prompt-tool-menu prompt-floating-menu tw-box-border tw-rounded-control tw-border tw-border-solid tw-border-app-border tw-bg-app-menu tw-shadow-menu"
          :style="toolMenuStyle"
        >
          <button
            v-for="tool in tools"
            :key="tool.id"
            type="button"
            :class="{
              'prompt-tool-menu-parent tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-rounded-control tw-px-2.5 tw-text-left':
                hasChildren(tool),
              active: activeToolGroupId === tool.id || tool.active,
              'is-template-tool tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-rounded-controlSm tw-px-2.5 tw-text-left':
                Boolean(tool.promptTemplateKey),
            }"
            :aria-haspopup="hasChildren(tool) ? 'menu' : undefined"
            :aria-expanded="
              hasChildren(tool) ? activeToolGroupId === tool.id : undefined
            "
            @click="handleToolClick(tool)"
          >
            <img
              v-if="tool.iconSrc"
              class="prompt-tool-icon-img tw-h-[18px] tw-w-[18px] tw-shrink-0 tw-object-contain"
              :src="tool.iconSrc"
              alt=""
              aria-hidden="true"
            />
            <span
              v-else-if="!tool.promptTemplateKey"
              class="prompt-tool-icon tw-shrink-0"
              aria-hidden="true"
              >{{ tool.icon }}</span
            >
            <span
              class="prompt-tool-text tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-text-left"
            >
              <strong>{{ tool.label }}</strong>
            </span>
            <span
              v-if="hasChildren(tool) && tool.active && !isSwitchParent(tool)"
              class="prompt-menu-active-badge tw-ml-auto tw-inline-flex tw-items-center tw-justify-center tw-rounded-full"
              aria-hidden="true"
            >
              {{ tool.activeCount }}
            </span>
            <span
              v-if="hasChildren(tool) && isSwitchParent(tool)"
              class="prompt-tool-parent-switch tw-ml-auto tw-shrink-0 tw-rounded-full"
              :class="{'is-active': tool.active}"
              role="switch"
              tabindex="0"
              :aria-pressed="tool.active"
              :aria-label="tool.label"
              @click.stop="handleToolSwitchClick(tool)"
              @keydown.enter.stop.prevent="handleToolSwitchClick(tool)"
              @keydown.space.stop.prevent="handleToolSwitchClick(tool)"
            >
              <span aria-hidden="true"></span>
            </span>
            <span
              v-if="hasChildren(tool)"
              class="prompt-submenu-arrow tw-ml-auto tw-shrink-0"
              aria-hidden="true"
            >
              ›
            </span>
          </button>

          <div
            v-if="activeToolGroup"
            class="prompt-popover prompt-tool-submenu tw-box-border tw-rounded-control tw-border tw-border-solid tw-border-app-border tw-bg-app-menu tw-shadow-menu"
            :class="`prompt-tool-submenu--${submenuPlacement}`"
            role="menu"
          >
            <button
              v-for="child in activeToolGroup.children"
              :key="child.id"
              class="prompt-tool-child-option tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-control tw-px-2.5 tw-text-left"
              :class="[
                `prompt-tool-child-option--${child.controlType || activeToolGroup.childControlType || 'default'}`,
                {'is-active': child.active},
              ]"
              type="button"
              :role="getChildRole(child)"
              :aria-checked="child.active"
              @click="$emit('apply-tool', child)"
            >
              <span
                v-if="isCheckboxChild(child)"
                class="prompt-tool-checkbox tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-[5px] tw-border tw-border-solid tw-border-app-controlBorder"
                aria-hidden="true"
              >
                <span v-if="child.active">✓</span>
              </span>
              <p>{{ child.label }}</p>
            </button>
          </div>
        </div>
      </div>

      <PromptAttachButton
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

    <button
      v-if="showVoiceStartButton"
      class="voice-button voice-button--start tw-inline-flex tw-items-center tw-justify-center"
      type="button"
      :disabled="disabled || !isSpeechSupported"
      :title="voiceStartLabel"
      :aria-label="voiceStartLabel"
      @click="$emit('start-voice')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <button
      v-else-if="showVoiceStopButton"
      class="voice-button voice-button--stop tw-inline-flex tw-items-center tw-justify-center"
      type="button"
      :disabled="disabled"
      :title="voiceStopLabel"
      :aria-label="voiceStopLabel"
      @click="$emit('stop-voice')"
    >
      <span aria-hidden="true"></span>
    </button>

    <button
      v-else
      class="send-button tw-inline-flex tw-items-center tw-justify-center"
      :class="{'send-button--loading': generating}"
      type="submit"
      :disabled="disabled || generating || !canSubmit"
      :title="sendLabel"
      :aria-label="sendLabel"
    >
      <span
        v-if="generating"
        class="send-button-spinner"
        aria-hidden="true"
      ></span>
      <span v-else aria-hidden="true">↗</span>
    </button>
  </div>
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptToolbarDesktop.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, inject, nextTick, reactive, ref, toRefs, watch} from "vue";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";
import {useI18n} from "vue-i18n";
import {
  PROMPT_TOOLBAR_STATE_KEY,
  createEmptyPromptToolbarState,
} from "@/composables/chat/chatActionContext";
import PromptAttachButton from "@/components/prompt/controls/PromptAttachButton.vue";
import PromptModelSelector from "@/components/prompt/controls/PromptModelSelector.vue";
import {usePromptToolMenuActions} from "@/composables/prompt/usePromptToolMenuActions";

const {t} = useI18n();

const modelSelectorRef = ref(null);
const toolRoot = ref(null);
const attachButtonRef = ref(null);
const toolMenuRef = ref(null);
const toolPositionReady = ref(false);
const submenuPlacement = ref("right");

const toolReferenceRef = computed(() => toolRoot.value || null);

const {floatingStyles: toolFloatingStyles, update: updateToolFloating} =
  useFloating(toolReferenceRef, toolMenuRef, {
    placement: "top-start",
    strategy: "absolute",
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({fallbackPlacements: ["top-end", "bottom-start", "bottom-end"]}),
      shift({padding: 12}),
    ],
  });

const toolMenuStyle = computed(() => ({
  ...toolFloatingStyles.value,
  visibility: toolPositionReady.value ? "visible" : "hidden",
}));

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
  get tools() {
    return toolbarState.value.tools;
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
  get canSubmit() {
    return toolbarState.value.canSubmit;
  },
  get hasPromptText() {
    return toolbarState.value.hasPromptText;
  },
  get isMicEnabled() {
    return toolbarState.value.isMicEnabled;
  },
  get isVoiceListening() {
    return toolbarState.value.isVoiceListening;
  },
  get hasVoiceStopped() {
    return toolbarState.value.hasVoiceStopped;
  },
  get generating() {
    return toolbarState.value.generating;
  },
  get isSpeechSupported() {
    return toolbarState.value.isSpeechSupported;
  },
  get voiceStartLabel() {
    return toolbarState.value.voiceStartLabel;
  },
  get voiceStopLabel() {
    return toolbarState.value.voiceStopLabel;
  },
  get attachLabel() {
    return toolbarState.value.attachLabel;
  },
  get sendLabel() {
    return toolbarState.value.sendLabel;
  },
  get modelSelectLabel() {
    return toolbarState.value.modelSelectLabel;
  },
  get readonlyTitle() {
    return toolbarState.value.readonlyTitle;
  },
});
const {
  disabled,
  modelReadonly,
  modelValue,
  currentModel,
  models,
  tools,
  attachOptions,
  modelMenuOpen,
  toolMenuOpen,
  attachMenuOpen,
  isMobileSheet,
  selectedTemplateTool,
  canSubmit,
  generating,
  isSpeechSupported,
  voiceStartLabel,
  voiceStopLabel,
  attachLabel,
  sendLabel,
  modelSelectLabel,
} = toRefs(props);

const emit = defineEmits([
  "open-model",
  "open-tool",
  "open-attach",
  "select-model",
  "apply-tool",
  "open-file-picker",
  "start-voice",
  "stop-voice",
]);

const resolvedReadonlyTitle = computed(
  () => props.readonlyTitle || t("prompt.modelReadonly")
);

const {
  activeToolGroupId,
  activeToolGroup,
  hasChildren,
  isSwitchParent,
  isCheckboxChild,
  getChildRole,
  handleToolClick,
  handleToolSwitchClick,
  closeActiveToolGroup,
} = usePromptToolMenuActions({
  tools: () => props.tools,
  emit,
  onGroupOpen: async () => {
    await nextTick();
    await updateToolFloating?.();
    resolveSubmenuPlacement();
  },
});

const showVoiceStartButton = computed(
  () =>
    !props.generating &&
    props.isMicEnabled &&
    props.isSpeechSupported &&
    !props.hasPromptText &&
    !props.isVoiceListening
);
const showVoiceStopButton = computed(
  () => !props.generating && props.isMicEnabled && props.isVoiceListening
);

function resolveSubmenuPlacement() {
  const menuRect = toolMenuRef.value?.getBoundingClientRect?.();
  if (!menuRect) {
    submenuPlacement.value = "right";
    return;
  }

  const submenuWidth = 248;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  const rightSpace = viewportWidth - menuRect.right;
  const leftSpace = menuRect.left;
  submenuPlacement.value =
    rightSpace >= submenuWidth || rightSpace >= leftSpace ? "right" : "left";
}

watch(
  () => props.toolMenuOpen,
  async (open) => {
    toolPositionReady.value = false;
    if (!open) {
      closeActiveToolGroup();
      return;
    }

    await nextTick();
    await updateToolFloating?.();
    toolPositionReady.value = true;
  },
  {flush: "post"}
);

watch(
  () => props.isMobileSheet,
  () => {
    closeActiveToolGroup();
  }
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

defineExpose({modelRoot, toolRoot, attachRoot});
</script>

<style scoped lang="scss">
.prompt-action-row {
  min-width: 0;
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
