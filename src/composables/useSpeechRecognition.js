import {computed, onBeforeUnmount, ref} from 'vue';

const DEFAULT_LANGUAGE = 'ko-KR';
const AUTO_RESTART_DELAY = 250;

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(options = {}) {
  const isListening = ref(false);
  const isSupported = ref(Boolean(getSpeechRecognitionConstructor()));
  const hasManualStop = ref(false);
  const errorMessage = ref('');
  const baseText = ref('');
  const transcriptText = ref('');
  let recognition = null;
  let restartTimer = null;
  let shouldAutoRestart = false;

  const language = computed(() => options.language || DEFAULT_LANGUAGE);

  function clearRestartTimer() {
    if (!restartTimer) return;
    window.clearTimeout(restartTimer);
    restartTimer = null;
  }

  function emitText(nextText) {
    transcriptText.value = nextText;
    options.onText?.(nextText);
  }

  function buildRecognition() {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    isSupported.value = Boolean(SpeechRecognition);
    if (!SpeechRecognition) return null;

    const instance = new SpeechRecognition();
    instance.lang = language.value;
    instance.continuous = true;
    instance.interimResults = true;
    instance.maxAlternatives = 1;

    instance.onstart = () => {
      isListening.value = true;
      errorMessage.value = '';
    };

    instance.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result?.[0]?.transcript || '';
        if (result.isFinal) finalText += text;
        else interimText += text;
      }

      const nextText = [baseText.value, finalText, interimText]
        .map((item) => item.trim())
        .filter(Boolean)
        .join(' ');
      emitText(nextText);
    };

    instance.onerror = (event) => {
      errorMessage.value = event?.error || 'speech-recognition-error';
    };

    instance.onend = () => {
      isListening.value = false;
      recognition = null;
      if (!shouldAutoRestart || hasManualStop.value) return;
      clearRestartTimer();
      restartTimer = window.setTimeout(() => {
        if (shouldAutoRestart && !hasManualStop.value) start(transcriptText.value);
      }, AUTO_RESTART_DELAY);
    };

    return instance;
  }

  function start(currentText = '') {
    if (!isSupported.value) {
      errorMessage.value = 'speech-recognition-not-supported';
      return false;
    }

    clearRestartTimer();
    hasManualStop.value = false;
    shouldAutoRestart = true;
    baseText.value = currentText.trim();
    transcriptText.value = currentText;

    if (recognition) {
      try {
        recognition.abort();
      } catch (error) {
        // Ignore abort race conditions from browser recognition engines.
      }
    }

    recognition = buildRecognition();
    if (!recognition) return false;

    try {
      recognition.start();
      return true;
    } catch (error) {
      errorMessage.value = error?.message || 'speech-recognition-start-failed';
      recognition = null;
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
      recognition = null;
    }
  }

  function resetToMic() {
    hasManualStop.value = false;
    errorMessage.value = '';
  }

  onBeforeUnmount(() => {
    shouldAutoRestart = false;
    clearRestartTimer();
    if (!recognition) return;
    try {
      recognition.abort();
    } catch (error) {
      // Ignore cleanup errors.
    }
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
