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
 * - 모바일 + ON  : 백그라운드 성격 이벤트에서 abort
 * - 모바일 + OFF : lifecycle 이벤트에서 명시적 abort 금지
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

  window.addEventListener?.("freeze", handleFreeze, {capture: true});

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

/**
 * 수신된 SSE frame을 누적 문자열로 변환합니다.
 */
function appendParsedEvents(events, accumulated) {
  let nextAccumulated = accumulated;
  let changed = false;
  let streamDone = false;

  for (const event of events) {
    const data = readSseData(event);

    if (data.done) {
      streamDone = true;
      break;
    }

    if (!data.content) continue;

    nextAccumulated += data.content;
    changed = true;
  }

  return {
    accumulated: nextAccumulated,
    changed,
    done: streamDone,
  };
}

/**
 * 스트림 수신 루프와 화면 반영을 분리합니다.
 *
 * onChunk가 Vue 렌더링, markdown 파싱, scroll 처리 등 무거운 작업을 포함하더라도
 * reader.read() 루프가 그 작업을 기다리지 않도록 최신 누적값만 예약 반영합니다.
 */
function createChunkCommitter(onChunk) {
  let latestValue = "";
  let committedValue = "";
  let scheduled = false;
  let chain = Promise.resolve();

  const run = async () => {
    scheduled = false;

    if (!latestValue || latestValue === committedValue) {
      return;
    }

    const valueToCommit = latestValue;
    committedValue = valueToCommit;

    await onChunk?.(valueToCommit);

    if (latestValue !== committedValue) {
      schedule();
    }
  };

  function schedule() {
    if (scheduled) return chain;

    scheduled = true;
    chain = chain.catch(() => {}).then(run);

    return chain;
  }

  function update(value) {
    latestValue = value || "";
    return schedule();
  }

  async function flush(value) {
    if (typeof value === "string") {
      latestValue = value;
    }

    scheduled = false;
    await chain.catch(() => {});

    if (latestValue && latestValue !== committedValue) {
      const valueToCommit = latestValue;
      committedValue = valueToCommit;
      await onChunk?.(valueToCommit);
    }
  }

  return {
    update,
    flush,
  };
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
  const committer = createChunkCommitter(onChunk);

  if (controller) apiRequestStore.registerController(requestKey, controller);
  if (overlay) apiRequestStore.startOverlay();

  let accumulated = "";

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
    let done = false;

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

      const nextState = appendParsedEvents(parsed.events, accumulated);
      accumulated = nextState.accumulated;

      if (nextState.done) {
        done = true;
      }

      if (nextState.changed) {
        committer.update(accumulated);
      }
    }

    await committer.flush(accumulated);
    await onComplete?.();
  } catch (error) {
    // 모바일 background OFF 상태에서도 브라우저가 stream connection을 중단할 수 있습니다.
    // 이 경우에도 JS가 이미 받은 accumulated 값은 catch로 넘어가기 전에 반드시 화면에 반영합니다.
    await committer.flush(accumulated);
    throw error;
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
