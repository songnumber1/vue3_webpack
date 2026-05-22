import {computed, onBeforeUnmount, ref} from "vue";

const DEFAULT_LANGUAGE = "ko-KR";
const AUTO_RESTART_DELAY = 250;
const DUPLICATE_NORMALIZE_PATTERN = /\s+/g;

/**
 * @description 현재 런타임에서 SpeechRecognition을 안전하게 실행할 수 있는지 확인합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {boolean} SpeechRecognition 생성자가 있으면 true를 반환합니다.
 */
function isSpeechRecognitionRuntimeSupported() {
  return Boolean(getSpeechRecognitionConstructor());
}
function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null;

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}
export function useSpeechRecognition(options = {}) {
  const isListening = ref(false);
  const isSupported = ref(isSpeechRecognitionRuntimeSupported());
  const hasManualStop = ref(false);
  const errorMessage = ref("");
  const baseText = ref("");
  const transcriptText = ref("");
  let recognition = null;
  let restartTimer = null;
  let shouldAutoRestart = false;
  let committedTranscript = "";
  let interimTranscript = "";

  const language = computed(() => options.language || DEFAULT_LANGUAGE);
  function clearRestartTimer() {
    if (!restartTimer) return;
    window.clearTimeout(restartTimer);
    restartTimer = null;
  }
  function normalizeText(value) {
    return String(value || "")
      .replace(DUPLICATE_NORMALIZE_PATTERN, " ")
      .trim();
  }
  function mergeText(...parts) {
    return parts.map(normalizeText).filter(Boolean).join(" ");
  }
  function emitText(nextText) {
    transcriptText.value = nextText;
    options.onText?.(nextText);
  }

  /**
   * @description SpeechRecognition 인스턴스에 연결된 브라우저 이벤트 핸들러를 모두 해제합니다.
   * @param {SpeechRecognition|null} instance - 이벤트 핸들러를 제거할 음성 인식 인스턴스입니다.
   * @returns {void} 인스턴스가 없으면 아무 작업도 하지 않습니다.
   */
  function detachRecognitionHandlers(instance) {
    if (!instance) return;
    instance.onstart = null;
    instance.onresult = null;
    instance.onerror = null;
    instance.onend = null;
  }

  /**
   * @description 현재 인스턴스를 중지하고 이벤트 핸들러를 해제해 재생성 시 중복 호출을 방지합니다.
   * @param {boolean} abortActive - true이면 브라우저 인식 작업도 함께 abort 처리합니다.
   * @returns {void} 내부 recognition 참조를 항상 null로 정리합니다.
   */
  function cleanupRecognition(abortActive = false) {
    const current = recognition;
    recognition = null;
    if (!current) return;
    detachRecognitionHandlers(current);
    if (!abortActive) return;
    try {
      current.abort();
    } catch (error) {
      void error;
    }
  }
  function buildRecognition() {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    isSupported.value = isSpeechRecognitionRuntimeSupported();
    if (!SpeechRecognition || !isSupported.value) return null;

    const instance = new SpeechRecognition();
    instance.lang = language.value;
    instance.continuous = true;
    instance.interimResults = true;
    instance.maxAlternatives = 1;

    instance.onstart = () => {
      isListening.value = true;
      errorMessage.value = "";
    };

    instance.onresult = (event) => {
      interimTranscript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const resultText = normalizeText(result?.[0]?.transcript || "");
        if (!resultText) continue;

        if (result.isFinal) {
          const currentFinal = normalizeText(committedTranscript);
          const alreadyIncluded =
            currentFinal &&
            (currentFinal === resultText ||
              currentFinal.endsWith(` ${resultText}`));

          if (alreadyIncluded) {
            continue;
          }

          committedTranscript =
            currentFinal && resultText.startsWith(currentFinal)
              ? resultText
              : mergeText(committedTranscript, resultText);
        } else {
          interimTranscript = mergeText(interimTranscript, resultText);
        }
      }

      emitText(
        mergeText(baseText.value, committedTranscript, interimTranscript)
      );
    };

    instance.onerror = (event) => {
      errorMessage.value = event?.error || "speech-recognition-error";
    };

    instance.onend = () => {
      isListening.value = false;
      const endedRecognition = recognition;
      recognition = null;
      detachRecognitionHandlers(endedRecognition);
      if (!shouldAutoRestart || hasManualStop.value) return;
      clearRestartTimer();
      restartTimer = window.setTimeout(() => {
        if (shouldAutoRestart && !hasManualStop.value)
          start(transcriptText.value);
      }, AUTO_RESTART_DELAY);
    };

    return instance;
  }
  function start(currentText = "") {
    isSupported.value = isSpeechRecognitionRuntimeSupported();
    if (!isSupported.value) {
      errorMessage.value = "speech-recognition-not-supported";

      return false;
    }

    clearRestartTimer();
    hasManualStop.value = false;

    shouldAutoRestart = true;

    baseText.value = normalizeText(currentText);
    transcriptText.value = baseText.value;
    committedTranscript = "";
    interimTranscript = "";

    cleanupRecognition(true);

    recognition = buildRecognition();
    if (!recognition) return false;

    try {
      recognition.start();

      return true;
    } catch (error) {
      errorMessage.value = error?.message || "speech-recognition-start-failed";
      cleanupRecognition(false);

      return false;
    }
  }
  function stopByUser() {
    hasManualStop.value = true;
    shouldAutoRestart = false;
    clearRestartTimer();
    if (!recognition) {
      isListening.value = false;
      return;
    }
    try {
      recognition.stop();
    } catch (error) {
      isListening.value = false;
      cleanupRecognition(false);
    }
  }
  function resetToMic() {
    hasManualStop.value = false;
    errorMessage.value = "";
    committedTranscript = "";
    interimTranscript = "";
  }

  onBeforeUnmount(() => {
    shouldAutoRestart = false;
    clearRestartTimer();
    cleanupRecognition(true);
  });

  return {
    isSupported,
    isListening,
    hasManualStop,
    errorMessage,
    start,
    stopByUser,
    resetToMic,
  };
}
