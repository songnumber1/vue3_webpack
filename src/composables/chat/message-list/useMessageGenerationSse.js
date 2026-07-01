import {GENERATION_ERROR_TEST_MODEL_ID} from "@/constants/generationErrorTest";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {
  resolveGenerationUrl,
  resolveSseAuthOptions,
} from "@/api/sse/common/streamRequest";
import {SSE} from "@/api/sse/vendor/sse";

const DONE_MESSAGE = "[DONE]";
const GENERATION_TIMEOUT_MS = 120000;

function readModelId(payload = {}) {
  return payload?.[G.MODEL_ID] || payload?.[G.MODEL_ID_LEGACY] || "";
}

function readFirstString(...values) {
  return values.find((value) => typeof value === "string" && value.length) || "";
}

function readNormalMessage(event) {
  return String(event?.data || "");
}

function readThinkingMessage(event) {
  const parsed = JSON.parse(String(event?.data || ""));
  const delta = parsed.delta || parsed.data || parsed.message || {};

  return readFirstString(
    parsed.content,
    parsed.answer,
    parsed.text,
    parsed.reasoning,
    parsed.reasoningContent,
    delta.content,
    delta.answer,
    delta.text,
    delta.reasoning,
    delta.reasoningContent
  );
}

function getOnMessageFunc(modelId) {
  if (String(modelId || "") === GENERATION_ERROR_TEST_MODEL_ID) {
    return readThinkingMessage;
  }

  return readNormalMessage;
}

function createGenerationSource(payload) {
  const authOptions = resolveSseAuthOptions();

  return new SSE(resolveGenerationUrl(), {
    start: false,
    method: "POST",
    withCredentials: authOptions.withCredentials,
    autoReconnect: false,
    headers: {
      ...authOptions.headers,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    },
    payload: JSON.stringify(payload || {}),
  });
}

export function useMessageGenerationSse({onText, onDone, onError} = {}) {
  let eventSource = null;
  let timeoutId = null;
  let text = "";

  function clearTimer() {
    if (!timeoutId) return;
    window.clearTimeout(timeoutId);
    timeoutId = null;
  }

  function close() {
    clearTimer();
    eventSource?.close?.();
    eventSource = null;
  }

  function fail(error) {
    close();
    onError?.(error);
  }

  function complete() {
    close();
    onDone?.(text);
  }

  function start(payload = {}) {
    close();
    text = "";

    const readMessage = getOnMessageFunc(readModelId(payload));

    eventSource = createGenerationSource(payload);
    timeoutId = window.setTimeout(() => {
      fail(new Error("generation.do timeout"));
    }, GENERATION_TIMEOUT_MS);

    eventSource.onmessage = (event) => {
      try {
        const raw = String(event?.data || "");
        if (!raw.trim()) return;

        if (raw.trim() === DONE_MESSAGE) {
          complete();
          return;
        }

        text += readMessage(event);
        onText?.(text);
      } catch (error) {
        fail(error);
      }
    };

    eventSource.onerror = (error) => {
      fail(error);
    };

    eventSource.stream();
  }

  return {
    start,
    close,
  };
}

export {getOnMessageFunc};
