<template>
  <div class="prompt-action-row">
    <div class="prompt-left-actions">
      <div ref="modelRoot" class="prompt-selector-wrap">
        <button
          class="prompt-model-trigger"
          type="button"
          :disabled="disabled || modelReadonly"
          :title="modelReadonly ? resolvedReadonlyTitle : undefined"
          :aria-label="modelSelectLabel"
          @click="$emit('open-model')"
        >
          <span>{{ currentModel.label }}</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M5.5 7.5 10 12l4.5-4.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div ref="toolRoot" class="prompt-selector-wrap">
        <button
          class="prompt-icon-action prompt-tool-mobile-trigger"
          :class="{
            'prompt-icon-action--active': toolMenuOpen,
            'prompt-tool-mobile-trigger--selected':
              Boolean(selectedTemplateTool),
          }"
          type="button"
          :disabled="disabled"
          :title="selectedTemplateTool ? selectedTemplateTool.label : 'Tools'"
          :aria-label="
            selectedTemplateTool ? selectedTemplateTool.label : 'Tools'
          "
          @click="$emit('open-tool')"
        >
          <img
            v-if="selectedTemplateTool?.iconSrc"
            :src="selectedTemplateTool.iconSrc"
            alt=""
            aria-hidden="true"
          />
          <span v-else aria-hidden="true">＋</span>
        </button>
      </div>

      <div ref="attachRoot" class="prompt-selector-wrap attach-menu-wrap">
        <button
          class="prompt-icon-action attach-button"
          :class="{'prompt-icon-action--active': attachMenuOpen}"
          type="button"
          :title="attachLabel"
          :aria-label="attachLabel"
          :disabled="disabled"
          @click="$emit('open-attach')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21.4 11.6 12.1 20.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4.1 4.1 0 0 1 5.8 5.8l-9.4 9.4a2.2 2.2 0 1 1-3.1-3.1l8.6-8.6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
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
 * @file components/prompt/controls/PromptToolbarMobile.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, inject, reactive, ref, toRefs} from "vue";
import {useI18n} from "vue-i18n";
import {
  PROMPT_TOOLBAR_STATE_KEY,
  createEmptyPromptToolbarState,
} from "@/composables/chat/chatActionContext";

const {t} = useI18n();
const modelRoot = ref(null);
const toolRoot = ref(null);
const attachRoot = ref(null);

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
  currentModel,
  toolMenuOpen,
  attachMenuOpen,
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

defineEmits([
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

defineExpose({modelRoot, toolRoot, attachRoot});
</script>

<style scoped lang="scss">
.prompt-action-row,
.prompt-left-actions,
.prompt-selector-wrap {
  min-width: 0;
}

.prompt-model-trigger span {
  min-width: 0;
}

.prompt-tool-mobile-trigger img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.prompt-tool-mobile-trigger--selected {
  background: transparent;
  border-color: var(--control-border);
}
</style>
