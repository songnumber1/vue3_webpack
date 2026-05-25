/**
 * @file composables/prompt/usePromptSpeech.js
 * @description 프롬프트 입력 도메인 composable입니다. 텍스트/첨부/도구/모델 선택 상태와 submit emit을 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, nextTick} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useSpeechRecognition} from "@/platform/speech/useSpeechRecognition";
import {PROMPT_SPEECH_LANGUAGE} from "@/constants/promptComposer";

/**
 * @description 음성 입력 시작/중지, 마이크 가용 여부를 관리합니다.
 * @param {object} options - text ref, resize 함수, closeMenus 함수, disabled props ref
 * @returns {object} 음성 관련 상태 및 핸들러
 */
export function usePromptSpeech({
  text,
  resize,
  closeMenus,
  disabled,
  focusTextarea,
}) {
  const platformStore = usePlatformStore();
  const systemSettingsStore = useSystemSettingsStore();

  const isMicEnabled = computed(
    () => systemSettingsStore.useMicrophone && Boolean(platformStore.info.isMic)
  );

  const speech = useSpeechRecognition({
    language: PROMPT_SPEECH_LANGUAGE,
    onText: (nextText) => {
      text.value = nextText;
      nextTick(resize);
    },
  });

  function startVoiceInput() {
    if (disabled.value || !isMicEnabled.value || !speech.isSupported.value)
      return;
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
