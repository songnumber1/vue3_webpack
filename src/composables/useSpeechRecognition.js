import {computed, onBeforeUnmount, ref} from "vue";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const DEFAULT_LANGUAGE = "ko-KR";
const AUTO_RESTART_DELAY = 250;
const DUPLICATE_NORMALIZE_PATTERN = /\s+/g;

/**
 * @description 현재 브라우저가 Android Firefox인지 확인합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {boolean} Android Firefox 환경이면 true를 반환합니다.
 */
function isAndroidFirefoxBrowser() {
  // SSR 또는 테스트 환경에서는 브라우저 정보가 없으므로 미지원 브라우저로 판단하지 않습니다.
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";

  // Firefox Android는 Web Speech API의 SpeechRecognition 구현이 없어 마이크 시작을 방어합니다.
  return /Android/i.test(userAgent) && /Firefox/i.test(userAgent);
}

/**
 * @description 현재 런타임에서 SpeechRecognition을 안전하게 실행할 수 있는지 확인합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {boolean} SpeechRecognition 생성자가 있고 Android Firefox가 아니면 true를 반환합니다.
 */
function isSpeechRecognitionRuntimeSupported() {
  // 브라우저 생성자 지원 여부와 Firefox Android 제외 정책을 함께 확인합니다.
  return Boolean(getSpeechRecognitionConstructor()) && !isAndroidFirefoxBrowser();
}

/**
 * @description getSpeechRecognitionConstructor 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getSpeechRecognitionConstructor() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window === "undefined") return null;
  // 계산된 결과를 호출부로 반환합니다.
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * @description useSpeechRecognition 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} options - options 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
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

  /**
   * @description clearRestartTimer 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function clearRestartTimer() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!restartTimer) return;
    window.clearTimeout(restartTimer);
    restartTimer = null;
  }

  /**
   * @description normalizeText 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} value - value 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function normalizeText(value) {
    // 계산된 결과를 호출부로 반환합니다.
    return String(value || "")
      .replace(DUPLICATE_NORMALIZE_PATTERN, " ")
      .trim();
  }

  /**
   * @description mergeText 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} parts - parts 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function mergeText(...parts) {
    // 계산된 결과를 호출부로 반환합니다.
    return parts.map(normalizeText).filter(Boolean).join(" ");
  }

  /**
   * @description emitText 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} nextText - nextText 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function emitText(nextText) {
    transcriptText.value = nextText;
    options.onText?.(nextText);
  }

  /**
   * @description buildRecognition 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function buildRecognition() {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    isSupported.value = isSpeechRecognitionRuntimeSupported();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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

      // 목록 또는 결과 집합을 순회하면서 필요한 값만 선별합니다.
      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const resultText = normalizeText(result?.[0]?.transcript || "");
        // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
        if (!resultText) continue;

        // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
        if (result.isFinal) {
          const currentFinal = normalizeText(committedTranscript);
          const alreadyIncluded =
            currentFinal &&
            (currentFinal === resultText ||
              currentFinal.endsWith(` ${resultText}`));

          // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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
      recognition = null;
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!shouldAutoRestart || hasManualStop.value) return;
      clearRestartTimer();
      restartTimer = window.setTimeout(() => {
        // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
        if (shouldAutoRestart && !hasManualStop.value)
          start(transcriptText.value);
      }, AUTO_RESTART_DELAY);
    };

    // 계산된 결과를 호출부로 반환합니다.
    return instance;
  }

  /**
   * @description start 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} currentText - currentText 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function start(currentText = "") {
    isSupported.value = isSpeechRecognitionRuntimeSupported();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!isSupported.value) {
      errorMessage.value = "speech-recognition-not-supported";
      // 계산된 결과를 호출부로 반환합니다.
      return false;
    }

    clearRestartTimer();
    hasManualStop.value = false;

    shouldAutoRestart = true;

    baseText.value = normalizeText(currentText);
    transcriptText.value = baseText.value;
    committedTranscript = "";
    interimTranscript = "";

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (recognition) {
      // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
      try {
        recognition.abort();
      } catch (error) {
      }
    }

    recognition = buildRecognition();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!recognition) return false;

    // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
    try {
      recognition.start();
      // 계산된 결과를 호출부로 반환합니다.
      return true;
    } catch (error) {
      errorMessage.value = error?.message || "speech-recognition-start-failed";
      recognition = null;
      // 계산된 결과를 호출부로 반환합니다.
      return false;
    }
  }

  /**
   * @description stopByUser 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function stopByUser() {
    hasManualStop.value = true;
    shouldAutoRestart = false;
    clearRestartTimer();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!recognition) {
      isListening.value = false;
      return;
    }
    // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
    try {
      recognition.stop();
    } catch (error) {
      isListening.value = false;
      recognition = null;
    }
  }

  /**
   * @description resetToMic 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function resetToMic() {
    hasManualStop.value = false;
    errorMessage.value = "";
    committedTranscript = "";
    interimTranscript = "";
  }

  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
  onBeforeUnmount(() => {
    shouldAutoRestart = false;
    clearRestartTimer();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!recognition) return;
    // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
    try {
      recognition.abort();
    } catch (error) {
    }
  });

  // 계산된 결과를 호출부로 반환합니다.
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
