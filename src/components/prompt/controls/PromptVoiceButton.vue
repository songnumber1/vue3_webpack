<template>
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
    <span v-if="generating" class="send-button-spinner" aria-hidden="true"></span>
    <span v-else aria-hidden="true">↗</span>
  </button>
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptVoiceButton.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  disabled: {type: Boolean, default: false},
  canSubmit: {type: Boolean, default: false},
  hasPromptText: {type: Boolean, default: false},
  isMicEnabled: {type: Boolean, default: false},
  isVoiceListening: {type: Boolean, default: false},
  generating: {type: Boolean, default: false},
  isSpeechSupported: {type: Boolean, default: true},
  voiceStartLabel: {type: String, default: "Start voice input"},
  voiceStopLabel: {type: String, default: "Stop voice input"},
  sendLabel: {type: String, default: "Send"},
});

defineEmits(["start-voice", "stop-voice"]);

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
</script>
