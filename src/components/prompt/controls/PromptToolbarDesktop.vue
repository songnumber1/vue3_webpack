<template>
  <div class="prompt-action-row">
    <div class="prompt-left-actions">
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

      <div ref="toolRoot" class="prompt-selector-wrap">
        <button
          v-if="!selectedTemplateTool"
          class="prompt-icon-action"
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
          class="prompt-selected-tool-chip prompt-selected-tool-chip--desktop"
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
          class="prompt-popover prompt-tool-menu prompt-floating-menu"
          :style="toolMenuStyle"
        >
          <button
            v-for="tool in tools"
            :key="tool.id"
            type="button"
            :class="{
              'prompt-tool-menu-parent': hasChildren(tool),
              active: activeToolGroupId === tool.id || tool.active,
              'is-template-tool': Boolean(tool.promptTemplateKey),
            }"
            :aria-haspopup="hasChildren(tool) ? 'menu' : undefined"
            :aria-expanded="
              hasChildren(tool) ? activeToolGroupId === tool.id : undefined
            "
            @click="handleToolClick(tool)"
          >
            <img
              v-if="tool.iconSrc"
              class="prompt-tool-icon-img"
              :src="tool.iconSrc"
              alt=""
              aria-hidden="true"
            />
            <span
              v-else-if="!tool.promptTemplateKey"
              class="prompt-tool-icon"
              aria-hidden="true"
              >{{ tool.icon }}</span
            >
            <span class="prompt-tool-text">
              <strong>{{ tool.label }}</strong>
            </span>
            <span
              v-if="hasChildren(tool) && tool.active && !isSwitchParent(tool)"
              class="prompt-menu-active-badge"
              aria-hidden="true"
            >
              {{ tool.activeCount }}
            </span>
            <span
              v-if="hasChildren(tool) && isSwitchParent(tool)"
              class="prompt-tool-parent-switch"
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
              class="prompt-submenu-arrow"
              aria-hidden="true"
            >
              ›
            </span>
          </button>

          <div
            v-if="activeToolGroup"
            class="prompt-popover prompt-tool-submenu"
            :class="`prompt-tool-submenu--${submenuPlacement}`"
            role="menu"
          >
            <button
              v-for="child in activeToolGroup.children"
              :key="child.id"
              class="prompt-tool-child-option"
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
                class="prompt-tool-checkbox"
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
      class="voice-button voice-button--start"
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
      class="voice-button voice-button--stop"
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
      class="send-button"
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
