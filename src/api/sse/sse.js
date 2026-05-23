import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {SERVER_API_BASE_URL, shouldUseServerApi} from "@/constants/apiMode";
import {API_KEYS, resolveApiPolicy} from "@/constants/apiConfig";
import {pickGenerationSample} from "@/api/mock/data/generationSamples.raw";
import {streamText} from "@/api/mock/fakeStream";
import {parseSseBuffer, readSseData} from "@/api/sse/sseParser";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {isMobileLikeViewport} from "@/platform/viewport/viewportMode";
import {logWarn} from "@/utils/logger";


export function isGenerationAbortError(error) {
  const message = String(error?.message || error || "");
  return (
    error?.name === "AbortError" ||
    error?.code === 20 ||
    /aborted|abort|page lifecycle ended|mobile page hidden/i.test(message)
  );
}

function createAbortError(reason) {
  if (typeof DOMException !== "undefined") {
    return new DOMException(reason || "Aborted", "AbortError");
  }
  const error = new Error(reason || "Aborted");
  error.name = "AbortError";
  return error;
}

function shouldAbortChatOnMobileBackground() {
  if (typeof document === "undefined") return false;
  try {
    const settings = useSystemSettingsStore();
    return Boolean(
      settings.abortChatOnMobileBackground &&
        isMobileLikeViewport(settings.mobileBreakpoint)
    );
  } catch (_error) {
    return false;
  }
}

function createStreamLifecycleGuard(controller, getReader) {
  if (!controller || typeof window === "undefined") {
    return () => {};
  }

  const abortStream = (reason) => {
    if (controller.signal.aborted) return;
    const abortReason = createAbortError(reason);
    try {
      controller.abort(abortReason);
    } catch (_error) {
      controller.abort();
    }

    const reader = getReader?.();
    if (reader) {
      reader.cancel(controller.signal.reason || abortReason).catch((error) => {
        if (!isGenerationAbortError(error)) {
          logWarn("[streamGeneration] reader cancel failed:", error);
        }
      });
    }
  };

  const handlePageEnd = () => abortStream("page lifecycle ended");
  const handleVisibilityChange = () => {
    if (document.hidden && shouldAbortChatOnMobileBackground()) {
      abortStream("mobile page hidden");
    }
  };

  window.addEventListener("pagehide", handlePageEnd, {capture: true});
  window.addEventListener("beforeunload", handlePageEnd, {capture: true});
  document.addEventListener("visibilitychange", handleVisibilityChange, {
    capture: true,
  });

  if (typeof window.addEventListener === "function") {
    window.addEventListener("freeze", handlePageEnd, {capture: true});
  }

  return () => {
    window.removeEventListener("pagehide", handlePageEnd, {capture: true});
    window.removeEventListener("beforeunload", handlePageEnd, {capture: true});
    document.removeEventListener("visibilitychange", handleVisibilityChange, {
      capture: true,
    });
    window.removeEventListener?.("freeze", handlePageEnd, {capture: true});
  };
}

function isDocumentHidden() {
  return typeof document !== "undefined" && document.hidden;
}

function waitForBrowserPaint() {
  if (isDocumentHidden()) {
    return Promise.resolve();
  }
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function resolveGenerationUrl() {
  const base = shouldUseServerApi() ? SERVER_API_BASE_URL : "/api";
  return `${base.replace(/\/$/, "")}${API_ENDPOINTS.GENERATION}`;
}

function shouldUseOverlay(policy) {
  const settings = useSystemSettingsStore();
  return Boolean(
    policy.overlay &&
    settings.showMobileApiProgress &&
    isMobileLikeViewport(settings.mobileBreakpoint)
  );
}

export async function streamGeneration(payload = {}, handlers = {}) {
  const {onChunk, onComplete} = handlers;

  if (!shouldUseServerApi()) {
    const text = pickGenerationSample(payload.input);
    await streamText(text, (chunk) => onChunk?.(chunk), {delay: 18});
    await onComplete?.();
    return;
  }

  const policy = resolveApiPolicy(API_KEYS.GENERATION);
  const apiRequestStore = useApiRequestStore();
  const controller =
    policy.abort && typeof AbortController !== "undefined"
      ? new AbortController()
      : null;
  const requestKey = `GENERATION-${Date.now()}-${Math.random()}`;
  const overlay = shouldUseOverlay(policy);

  let reader = null;
  const cleanupLifecycleGuard = createStreamLifecycleGuard(controller, () => reader);

  if (controller) apiRequestStore.registerController(requestKey, controller);
  if (overlay) apiRequestStore.startOverlay();

  try {
    const response = await fetch(resolveGenerationUrl(), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });

    if (!response.ok) {
      throw new Error(`generation stream failed: ${response.status}`);
    }
    if (!response.body) {
      throw new Error("generation stream body is empty");
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let accumulated = "";
    let done = false;
    let hiddenBacklogPending = false;
    let resumeBacklogFlushPending = false;
    let flushingHiddenBacklog = null;

    const flushHiddenBacklog = async () => {
      if (!hiddenBacklogPending || !accumulated) return;
      hiddenBacklogPending = false;
      await onChunk?.(accumulated);
    };

    const scheduleHiddenBacklogFlush = () => {
      if (isDocumentHidden() || !hiddenBacklogPending) return;
      flushingHiddenBacklog = Promise.resolve(flushingHiddenBacklog)
        .catch(() => {})
        .then(flushHiddenBacklog);
    };

    const handleResumeFlush = () => {
      if (isDocumentHidden()) {
        resumeBacklogFlushPending = true;
        return;
      }
      scheduleHiddenBacklogFlush();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleResumeFlush, {
        capture: true,
      });
    }

    try {
      while (!done) {
        if (controller?.signal?.aborted) {
          throw controller.signal.reason || createAbortError("Aborted");
        }
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          buffer += decoder.decode(result.value, {stream: true});
        }
        if (done) {
          buffer += decoder.decode();
        }
        const parsed = parseSseBuffer(buffer);
        buffer = parsed.rest;

        const shouldBatchBacklog =
          isDocumentHidden() || hiddenBacklogPending || resumeBacklogFlushPending;

        if (shouldBatchBacklog) {
          let changed = false;
          for (const event of parsed.events) {
            const data = readSseData(event);
            if (data.done) {
              done = true;
              break;
            }
            accumulated += data.content;
            changed = true;
          }

          if (isDocumentHidden()) {
            hiddenBacklogPending = hiddenBacklogPending || changed;
            continue;
          }

          if (changed || hiddenBacklogPending || resumeBacklogFlushPending) {
            const hadHiddenBacklog = hiddenBacklogPending;
            resumeBacklogFlushPending = false;
            await flushHiddenBacklog();
            if (changed && !hadHiddenBacklog) {
              await onChunk?.(accumulated);
            }
          }
          continue;
        }

        for (const event of parsed.events) {
          const data = readSseData(event);
          if (data.done) {
            done = true;
            break;
          }
          accumulated += data.content;
          await onChunk?.(accumulated);
          await waitForBrowserPaint();
        }
      }
    } finally {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleResumeFlush, {
          capture: true,
        });
      }
    }

    if (hiddenBacklogPending) {
      await flushHiddenBacklog();
    }
    if (flushingHiddenBacklog) {
      await flushingHiddenBacklog.catch(() => {});
    }

    await onComplete?.();
  } finally {
    cleanupLifecycleGuard();
    if (reader && controller?.signal?.aborted) {
      await reader.cancel(controller.signal.reason).catch((error) => {
        if (!isGenerationAbortError(error)) {
          logWarn("[streamGeneration] reader cleanup failed:", error);
        }
      });
    }
    apiRequestStore.unregisterController(requestKey);
    if (overlay) apiRequestStore.stopOverlay();
  }
}
