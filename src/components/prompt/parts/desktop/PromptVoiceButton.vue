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
    type="submit"
    :disabled="disabled || !canSubmit"
    :title="sendLabel"
    :aria-label="sendLabel"
  >
    ↗
  </button>
</template>

<script setup>
import {computed} from "vue";

const props = defineProps({
  disabled: {type: Boolean, default: false},
  canSubmit: {type: Boolean, default: false},
  hasPromptText: {type: Boolean, default: false},
  isMicEnabled: {type: Boolean, default: false},
  isVoiceListening: {type: Boolean, default: false},
  isSpeechSupported: {type: Boolean, default: true},
  voiceStartLabel: {type: String, default: "Start voice input"},
  voiceStopLabel: {type: String, default: "Stop voice input"},
  sendLabel: {type: String, default: "Send"},
});

defineEmits(["start-voice", "stop-voice"]);

const showVoiceStartButton = computed(
  () =>
    props.isMicEnabled &&
    props.isSpeechSupported &&
    !props.hasPromptText &&
    !props.isVoiceListening
);
const showVoiceStopButton = computed(
  () => props.isMicEnabled && props.isVoiceListening
);
</script>
