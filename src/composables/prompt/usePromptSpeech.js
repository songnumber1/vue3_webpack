import {computed, nextTick} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {useSpeechRecognition} from "@/composables/useSpeechRecognition";
import {PROMPT_SPEECH_LANGUAGE} from "@/constants/promptComposer";

/**
 * @description 음성 입력 시작/중지, 마이크 가용 여부를 관리합니다.
 * @param {object} options - text ref, resize 함수, closeMenus 함수, disabled props ref
 * @returns {object} 음성 관련 상태 및 핸들러
 */
export function usePromptSpeech({text, resize, closeMenus, disabled, focusTextarea}) {
  const platformStore = usePlatformStore();

  const isMicEnabled = computed(() => Boolean(platformStore.info.isMic));

  const speech = useSpeechRecognition({
    language: PROMPT_SPEECH_LANGUAGE,
    onText: (nextText) => {
      text.value = nextText;
      nextTick(resize);
    },
  });

  function startVoiceInput() {
    if (disabled.value || !isMicEnabled.value || !speech.isSupported.value) return;
    closeMenus();
    speech.start(text.value);
  }

  function stopVoiceInput() {
    speech.stopByUser();
    nextTick(() => {
      focusTextarea();
      resize();
    });
  }

  return {
    isMicEnabled,
    isVoiceListening: speech.isListening,
    hasVoiceStopped: speech.hasManualStop,
    isSpeechSupported: speech.isSupported,
    speech,
    startVoiceInput,
    stopVoiceInput,
  };
}
