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
    /aborted|abort|page lifecycle ended|page lifecycle frozen|mobile page hidden|mobile page frozen|mobile page unloading/i.test(message)
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

function isMobileUserAgent() {
  if (typeof navigator === "undefined") return false;
  const ua = String(navigator.userAgent || "").toLowerCase();
  return /android|iphone|ipad|ipod|mobile|samsungbrowser|crios|fxios/.test(ua);
}

function isTouchRuntime() {
  if (typeof navigator === "undefined") return false;
  return Number(navigator.maxTouchPoints || 0) > 0;
}


const MOBILE_BACKGROUND_ABORT_RESUME_ALERT_MESSAGE =
  "모바일 백그라운드 전환으로 진행 중인 답변 요청이 종료되었습니다.";

let pendingMobileBackgroundAbortAlert = false;
let mobileBackgroundAbortAlertCleanup = null;

function clearMobileBackgroundAbortAlertListeners() {
  if (typeof mobileBackgroundAbortAlertCleanup === "function") {
    mobileBackgroundAbortAlertCleanup();
  }
  mobileBackgroundAbortAlertCleanup = null;
}

function showMobileBackgroundAbortResumeAlert() {
  if (!pendingMobileBackgroundAbortAlert) return;
  if (typeof document !== "undefined" && document.hidden) return;

  pendingMobileBackgroundAbortAlert = false;
  clearMobileBackgroundAbortAlertListeners();

  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(MOBILE_BACKGROUND_ABORT_RESUME_ALERT_MESSAGE);
  }
}

/**
 * SSE 전송 중 모바일 백그라운드 abort가 발생했을 때만 foreground 복귀 alert를 예약합니다.
 *
 * stream lifecycle guard는 abort 직후 cleanup될 수 있으므로, 복귀 알림은 guard cleanup과
 * 독립적인 1회성 listener로 관리합니다. 이렇게 해야 백그라운드 진입 시 stream이 정상
 * abort되어도 사용자가 앱으로 돌아왔을 때 종료 사실을 확인할 수 있습니다.
 */
function scheduleMobileBackgroundAbortResumeAlert() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  pendingMobileBackgroundAbortAlert = true;
  clearMobileBackgroundAbortAlertListeners();

  const handleResume = () => {
    showMobileBackgroundAbortResumeAlert();
  };

  document.addEventListener("visibilitychange", handleResume, {capture: true});
  window.addEventListener("pageshow", handleResume, {capture: true});
  window.addEventListener("focus", handleResume, {capture: true});

  mobileBackgroundAbortAlertCleanup = () => {
    document.removeEventListener("visibilitychange", handleResume, {
      capture: true,
    });
    window.removeEventListener("pageshow", handleResume, {capture: true});
    window.removeEventListener("focus", handleResume, {capture: true});
  };
}

function resolveMobileBackgroundPolicy() {
  if (typeof document === "undefined") {
    return {
      abortOnBackground: false,
      isMobileRuntime: false,
    };
  }

  try {
    const settings = useSystemSettingsStore();
    const viewportMobile = isMobileLikeViewport(settings.mobileBreakpoint);
    const isMobileRuntime = Boolean(
      viewportMobile ||
        isMobileUserAgent() ||
        (isTouchRuntime() &&
          typeof window !== "undefined" &&
          window.innerWidth <= settings.mobileBreakpoint)
    );

    return {
      abortOnBackground: Boolean(
        settings.abortChatOnMobileBackground && isMobileRuntime
      ),
      isMobileRuntime,
    };
  } catch (_error) {
    return {
      abortOnBackground: false,
      isMobileRuntime: false,
    };
  }
}

/**
 * 스트림 시작 시점의 모바일 백그라운드 정책을 snapshot으로 고정합니다.
 *
 * 설정 화면에서 OFF로 실행한 스트림이 모바일 lifecycle 이벤트 순서(pagehide → freeze →
 * beforeunload)에 따라 중간에 ON처럼 abort되는 문제를 막기 위해, 모바일 런타임에서는
 * visibilitychange/pagehide/freeze/beforeunload 모두 동일한 snapshot 정책을 따릅니다.
 *
 * - 모바일 + ON  : 백그라운드 성격 이벤트에서 abort
 * - 모바일 + OFF : 어떤 lifecycle 이벤트에서도 명시적 abort 금지
 * - 데스크톱     : pagehide/beforeunload는 페이지 이탈로 보고 abort
 */
function createStreamLifecycleGuard(controller, getReader, policySnapshot) {
  if (!controller || typeof window === "undefined") {
    return () => {};
  }

  const policy = policySnapshot || resolveMobileBackgroundPolicy();

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

  const abortForMobileBackgroundIfEnabled = (reason) => {
    if (policy.isMobileRuntime) {
      if (policy.abortOnBackground) {
        scheduleMobileBackgroundAbortResumeAlert();
        abortStream(reason);
      }
      return;
    }

    // 비모바일에서는 기존처럼 pagehide/beforeunload 계열을 페이지 이탈로 본다.
    abortStream(reason);
  };

  const handleVisibilityChange = () => {
    if (!document.hidden) return;
    if (policy.isMobileRuntime) {
      if (policy.abortOnBackground) {
        scheduleMobileBackgroundAbortResumeAlert();
        abortStream("mobile page hidden");
      }
      return;
    }
  };

  const handleFreeze = () => {
    abortForMobileBackgroundIfEnabled(
      policy.isMobileRuntime ? "mobile page frozen" : "page lifecycle frozen"
    );
  };

  const handlePageHide = () => {
    abortForMobileBackgroundIfEnabled(
      policy.isMobileRuntime ? "mobile page hidden" : "page lifecycle ended"
    );
  };

  const handleBeforeUnload = () => {
    abortForMobileBackgroundIfEnabled(
      policy.isMobileRuntime ? "mobile page unloading" : "page lifecycle ended"
    );
  };

  window.addEventListener("pagehide", handlePageHide, {capture: true});
  window.addEventListener("beforeunload", handleBeforeUnload, {capture: true});
  document.addEventListener("visibilitychange", handleVisibilityChange, {
    capture: true,
  });

  if (typeof window.addEventListener === "function") {
    window.addEventListener("freeze", handleFreeze, {capture: true});
  }

  return () => {
    window.removeEventListener("pagehide", handlePageHide, {capture: true});
    window.removeEventListener("beforeunload", handleBeforeUnload, {
      capture: true,
    });
    document.removeEventListener("visibilitychange", handleVisibilityChange, {
      capture: true,
    });
    window.removeEventListener?.("freeze", handleFreeze, {capture: true});
  };
}

function isDocumentHidden() {
  return typeof document !== "undefined" && document.hidden;
}

function waitForBrowserPaint() {
  if (isDocumentHidden()) {
    return Promise.resolve();
  }
  if (
    typeof window === "undefined" ||
    typeof window.requestAnimationFrame !== "function"
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let resolved = false;
    let frameId = null;

    const cleanup = () => {
      document.removeEventListener?.("visibilitychange", handleHidden, {
        capture: true,
      });
      window.removeEventListener?.("pagehide", handleHidden, {capture: true});
      window.removeEventListener?.("freeze", handleHidden, {capture: true});
      if (frameId !== null && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(frameId);
      }
    };

    const finish = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve();
    };

    const handleHidden = () => {
      // rAF 대기 중 visibilitychange/pagehide/freeze가 발생하면 일부 모바일
      // 브라우저에서 document.hidden 반영보다 lifecycle 이벤트가 먼저 올 수 있습니다.
      // hidden 값만 기다리면 reader 루프가 rAF에서 멈출 수 있으므로 즉시 해제합니다.
      finish();
    };

    document.addEventListener?.("visibilitychange", handleHidden, {
      capture: true,
    });
    window.addEventListener?.("pagehide", handleHidden, {capture: true});
    window.addEventListener?.("freeze", handleHidden, {capture: true});

    frameId = window.requestAnimationFrame(finish);
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
  const mobileBackgroundPolicy = resolveMobileBackgroundPolicy();
  const cleanupLifecycleGuard = createStreamLifecycleGuard(
    controller,
    () => reader,
    mobileBackgroundPolicy
  );

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
