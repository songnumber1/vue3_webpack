<template>
  <div class="prompt-submit-actions tw-flex tw-min-w-0 tw-items-center tw-justify-end">
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
      <span v-if="generating" class="send-button-spinner" aria-hidden="true"></span>
      <span v-else aria-hidden="true">↗</span>
    </button>
  </div>
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptSubmitActions.vue
 * @description 데스크톱 PromptComposer의 전송/음성 버튼만 담당하는 경량 컴포넌트입니다.
 */

import {computed} from "vue";
import {usePromptToolbarStateContext} from "@/composables/chat/context/useChatInject";

defineEmits(["start-voice", "stop-voice"]);

const toolbarState = usePromptToolbarStateContext();

const disabled = computed(() => toolbarState.value.disabled);
const canSubmit = computed(() => toolbarState.value.canSubmit);
const generating = computed(() => toolbarState.value.generating);
const isSpeechSupported = computed(() => toolbarState.value.isSpeechSupported);
const voiceStartLabel = computed(() => toolbarState.value.voiceStartLabel);
const voiceStopLabel = computed(() => toolbarState.value.voiceStopLabel);
const sendLabel = computed(() => toolbarState.value.sendLabel);

const showVoiceStartButton = computed(
  () =>
    !toolbarState.value.hideVoiceAction &&
    !toolbarState.value.generating &&
    toolbarState.value.isMicEnabled &&
    toolbarState.value.isSpeechSupported &&
    !toolbarState.value.hasPromptText &&
    !toolbarState.value.isVoiceListening
);
const showVoiceStopButton = computed(
  () =>
    !toolbarState.value.hideVoiceAction &&
    !toolbarState.value.generating &&
    toolbarState.value.isMicEnabled &&
    toolbarState.value.isVoiceListening
);
</script>

<style scoped lang="scss">
.prompt-submit-actions {
  margin-left: auto;
}
</style>
