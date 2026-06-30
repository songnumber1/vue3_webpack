import {SSE} from "@/api/sse/vendor/sse";
import {createChunkCommitter} from "@/api/sse/common/chunkCommitter";
import {createAbortError} from "@/api/sse/common/sseErrors";
import {
  resolveGenerationUrl,
  resolveSseAuthOptions,
} from "@/api/sse/common/streamRequest";
import {resetAuthStateSafely} from "@/auth/httpAuthInterceptor";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {resolveGenerationStreamParserFromPayload} from "@/api/sse/common/generationStreamParsers";

function readFirstString(...values) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim()
  );
  return found ? found.trim() : "";
}

function resolveGenerationRequestId(payload = {}) {
  return readFirstString(
    payload?.[G.REQUEST_ID],
    payload?.[G.REQUEST_ID_SNAKE],
    payload?.[G.MESSAGE_ID],
    payload?.[G.RESPONSE_MESSAGE_ID]
  );
}

function createGenerationStreamError(
  message = "generation stream returned error",
  code = "SSE_STREAM_ERROR",
  status
) {
  const error = new Error(message || "generation stream returned error");
  error.name = "GenerationStreamError";
  error.streamError = true;
  error.streamErrorCode = code || "SSE_STREAM_ERROR";
  if (status) error.status = status;
  return error;
}

const DEFAULT_GENERATION_STREAM_TIMEOUT_MS = 120000;

function resolveGenerationStreamTimeoutMs() {
  const raw = Number(process.env.VUE_APP_GENERATION_STREAM_TIMEOUT || 0);
  return Number.isFinite(raw) && raw > 0
    ? raw
    : DEFAULT_GENERATION_STREAM_TIMEOUT_MS;
}

function createGenerationTimeoutError() {
  const error = createGenerationStreamError(
    "generation stream timed out",
    "SSE_STREAM_TIMEOUT"
  );
  error.timeout = true;
  return error;
}

function readEventErrorMessage(event) {
  const rawData = event?.data;
  if (typeof rawData === "string" && rawData.trim()) return rawData;
  return event?.message || "generation stream failed";
}

function createSseEventError(event) {
  const status = event?.status || event?.responseCode;
  return createGenerationStreamError(
    readEventErrorMessage(event),
    "SSE_EVENT_ERROR",
    status
  );
}


function createGenerationDoneMissingError() {
  const error = createGenerationStreamError(
    "generation stream closed before DONE",
    "SSE_DONE_MISSING"
  );
  error.doneMissing = true;
  return error;
}

function getUnauthorizedStreamStatus(error) {
  const status = Number(
    error?.status || error?.responseCode || error?.code || 0
  );
  return status === 401 || status === 403 ? status : 0;
}

export async function runSseGenerationStream(
  payload,
  handlers,
  controller,
  lifecycle,
  runtimeType = "unknown"
) {
  const {onChunk, onComplete} = handlers || {};

  const committer = createChunkCommitter(onChunk);
  let source = null;
  let accumulated = "";
  let completed = false;
  let settled = false;

  const cleanupLifecycle = lifecycle?.install?.({
    controller,
    flush: () => committer.flush(accumulated),
  });

  const requestId = resolveGenerationRequestId(payload);
  const parseStreamMessage = resolveGenerationStreamParserFromPayload(payload);

  const closeSource = () => {
    if (!source) return;
    source.close();
  };

  const abortListener = () => closeSource();
  controller?.signal?.addEventListener?.("abort", abortListener, {once: true});

  const executeStream = async (authOptions) => {
    completed = false;
    settled = false;

    await new Promise((resolve, reject) => {
      let timeoutId = null;
      const clearStreamTimeout = () => {
        if (!timeoutId) return;
        clearTimeout(timeoutId);
        timeoutId = null;
      };
      const finishResolve = () => {
        if (settled) return;
        settled = true;
        clearStreamTimeout();
        resolve();
      };
      const finishReject = (error) => {
        if (settled) return;
        settled = true;
        clearStreamTimeout();
        closeSource();
        reject(error);
      };

      const timeoutMs = resolveGenerationStreamTimeoutMs();
      timeoutId = setTimeout(() => {
        finishReject(createGenerationTimeoutError());
      }, timeoutMs);

      source = new SSE(resolveGenerationUrl(), {
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

      source.addEventListener("message", (event) => {
        try {
          if (controller?.signal?.aborted) {
            throw controller.signal.reason || createAbortError("Aborted");
          }

          const nextState = parseStreamMessage(event.data, accumulated);
          accumulated = nextState.accumulated;

          if (nextState.changed) {
            lifecycle?.onAccumulated?.({accumulated, committer});
          }
          if (nextState.done) {
            completed = true;
            finishResolve();
            closeSource();
          }
        } catch (error) {
          closeSource();
          finishReject(error);
        }
      });

      source.addEventListener("error", (event) => {
        finishReject(createSseEventError(event));
      });

      source.addEventListener("abort", () => {
        if (controller?.signal?.aborted) {
          finishReject(controller.signal.reason || createAbortError("Aborted"));
          return;
        }
        if (!completed)
          finishReject(createAbortError("generation stream aborted"));
      });

      source.addEventListener("readystatechange", () => {
        if (
          source?.readyState === SSE.CLOSED &&
          !completed &&
          !controller?.signal?.aborted
        ) {
          finishReject(createGenerationDoneMissingError());
        }
      });

      source.stream();
    });
  };

  try {
    const authOptions = resolveSseAuthOptions();

    try {
      await executeStream(authOptions);
    } catch (error) {
      if (getUnauthorizedStreamStatus(error) && !controller?.signal?.aborted) {
        resetAuthStateSafely();
      }
      throw error;
    }

    await committer.flush(accumulated);
    await onComplete?.({requestId});

    return {
      completed: true,
      requestId,
      accumulated,
      runtimeType,
    };
  } catch (error) {
    await committer.flush(accumulated);
    error.accumulated = accumulated;
    error.generationRequestId = requestId;
    throw error;
  } finally {
    controller?.signal?.removeEventListener?.("abort", abortListener);
    cleanupLifecycle?.();
    closeSource();
  }
}
