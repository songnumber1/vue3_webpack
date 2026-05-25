import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {createAbortError, isGenerationAbortError} from "@/api/sse/common/sseErrors";
import {logWarn} from "@/utils/logger";
import {i18n} from "@/i18n";

const MOBILE_BACKGROUND_ABORT_RESUME_ALERT_KEY =
  "chat.lifecycle.mobileBackgroundAbortResumeAlert";

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
      if (!isGenerationAbortError(error)) {
        logWarn("[chromeLifecycle] reader cancel failed:", error);
      }
    });
  }
}

export function createChromeSseLifecycle() {
  const settings = useSystemSettingsStore();
  const abortOnBackground = Boolean(settings.abortChatOnMobileBackground);
  let hiddenBacklogPending = false;
  let pendingResumeAlert = false;
  let resumeAlertCleanup = null;

  const clearResumeAlertListeners = () => {
    if (typeof resumeAlertCleanup === "function") resumeAlertCleanup();
    resumeAlertCleanup = null;
  };

  const showResumeAlert = () => {
    if (!pendingResumeAlert) return;
    if (isDocumentHidden()) return;

    pendingResumeAlert = false;
    clearResumeAlertListeners();

    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(i18n.global.t(MOBILE_BACKGROUND_ABORT_RESUME_ALERT_KEY));
    }
  };

  const scheduleResumeAlert = () => {
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
  };

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
        /*
         * 중요:
         * background ON 상태에서 hidden 상태로 abort되면 streamGeneration finally가 즉시 실행되며
         * lifecycle cleanup도 같이 실행됩니다.
         *
         * 이때 resume alert listener까지 제거하면 사용자가 다시 foreground로 돌아왔을 때
         * "백그라운드 전환으로 답변 요청이 종료되었다"는 alert가 표시되지 않습니다.
         *
         * 따라서 pendingResumeAlert가 남아있는 경우에는 resume alert listener를 유지하고,
         * 실제 alert가 표시되는 시점(showResumeAlert)에서 1회성으로 정리합니다.
         */
        if (!pendingResumeAlert) {
          clearResumeAlertListeners();
        }

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
