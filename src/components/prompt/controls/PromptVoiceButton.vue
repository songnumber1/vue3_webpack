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
 * @description 전송/음성 버튼입니다. 버튼 상태는 PROMPT_TOOLBAR_STATE_KEY로 주입받습니다.
 */

import {computed, inject, reactive, toRefs} from "vue";
import {
  PROMPT_TOOLBAR_STATE_KEY,
  createEmptyPromptToolbarState,
} from "@/composables/chat/chatActionContext";

defineEmits(["start-voice", "stop-voice"]);

const toolbarState = inject(
  PROMPT_TOOLBAR_STATE_KEY,
  computed(createEmptyPromptToolbarState)
);
const props = reactive({
  get disabled() {
    return toolbarState.value.disabled;
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
  get sendLabel() {
    return toolbarState.value.sendLabel;
  },
});
const {
  disabled,
  canSubmit,
  generating,
  isSpeechSupported,
  voiceStartLabel,
  voiceStopLabel,
  sendLabel
} = toRefs(props);

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
