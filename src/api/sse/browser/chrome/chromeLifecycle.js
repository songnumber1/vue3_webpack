import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {createAbortError} from "@/api/sse/common/sseErrors";
import {logWarn} from "@/utils/logger";

const MOBILE_BACKGROUND_ABORT_RESUME_ALERT_MESSAGE =
  "모바일 백그라운드 전환으로 진행 중인 답변 요청이 종료되었습니다.";

let pendingResumeAlert = false;
let resumeAlertCleanup = null;

function clearResumeAlertListeners() {
  if (typeof resumeAlertCleanup === "function") resumeAlertCleanup();
  resumeAlertCleanup = null;
}

function showResumeAlert() {
  if (!pendingResumeAlert) return;
  if (typeof document !== "undefined" && document.hidden) return;

  pendingResumeAlert = false;
  clearResumeAlertListeners();

  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(MOBILE_BACKGROUND_ABORT_RESUME_ALERT_MESSAGE);
  }
}

function scheduleResumeAlert() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  pendingResumeAlert = true;
  clearResumeAlertListeners();

  const handleResume = () => showResumeAlert();
  document.addEventListener("visibilitychange", handleResume, {capture: true});
  window.addEventListener("pageshow", handleResume, {capture: true});
  window.addEventListener("focus", handleResume, {capture: true});

  resumeAlertCleanup = () => {
    document.removeEventListener("visibilitychange", handleResume, {capture: true});
    window.removeEventListener("pageshow", handleResume, {capture: true});
    window.removeEventListener("focus", handleResume, {capture: true});
  };
}

function isDocumentHidden() {
  return typeof document !== "undefined" && document.hidden;
}

function abortController(controller, getReader, reason) {
  if (!controller || controller.signal.aborted) return;

  const abortReason = createAbortError(reason);
  try {
    controller.abort(abortReason);
  } catch (_error) {
    controller.abort();
  }

  const reader = getReader?.();
  if (reader) {
    reader.cancel(controller.signal.reason || abortReason).catch((error) => {
      logWarn("[chromeLifecycle] reader cancel failed:", error);
    });
  }
}

export function createChromeSseLifecycle() {
  const settings = useSystemSettingsStore();
  const abortOnBackground = Boolean(settings.abortChatOnMobileBackground);
  let hiddenBacklogPending = false;

  return {
    install({controller, getReader, flush}) {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return () => {};
      }

      const abortForBackground = (reason) => {
        if (!abortOnBackground) return;
        scheduleResumeAlert();
        abortController(controller, getReader, reason);
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          hiddenBacklogPending = true;
          abortForBackground("mobile page hidden");
          return;
        }

        if (hiddenBacklogPending) {
          hiddenBacklogPending = false;
          flush?.();
        }
      };

      const handlePageHide = () => abortForBackground("mobile page hidden");
      const handleFreeze = () => abortForBackground("mobile page frozen");
      const handleFocus = () => {
        if (!isDocumentHidden() && hiddenBacklogPending) {
          hiddenBacklogPending = false;
          flush?.();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange, {capture: true});
      window.addEventListener("pagehide", handlePageHide, {capture: true});
      window.addEventListener("freeze", handleFreeze, {capture: true});
      window.addEventListener("pageshow", handleFocus, {capture: true});
      window.addEventListener("focus", handleFocus, {capture: true});

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange, {capture: true});
        window.removeEventListener("pagehide", handlePageHide, {capture: true});
        window.removeEventListener("freeze", handleFreeze, {capture: true});
        window.removeEventListener("pageshow", handleFocus, {capture: true});
        window.removeEventListener("focus", handleFocus, {capture: true});
      };
    },

    onAccumulated({accumulated, committer}) {
      if (isDocumentHidden()) {
        hiddenBacklogPending = true;
        committer.update(accumulated);
        return;
      }
      committer.update(accumulated);
    },
  };
}
