import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {abortGenerationController} from "@/api/sse/common/sseErrors";
import {i18n} from "@/i18n";

const MOBILE_BACKGROUND_ABORT_RESUME_ALERT_KEY =
  "chat.lifecycle.mobileBackgroundAbortResumeAlert";

function isDocumentHidden() {
  return typeof document !== "undefined" && document.hidden;
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
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    pendingResumeAlert = true;
    clearResumeAlertListeners();

    const handleResume = () => showResumeAlert();

    document.addEventListener("visibilitychange", handleResume, {
      capture: true,
    });
    window.addEventListener("pageshow", handleResume, {capture: true});
    window.addEventListener("focus", handleResume, {capture: true});

    resumeAlertCleanup = () => {
      document.removeEventListener("visibilitychange", handleResume, {
        capture: true,
      });
      window.removeEventListener("pageshow", handleResume, {capture: true});
      window.removeEventListener("focus", handleResume, {capture: true});
    };
  };

  return {
    install({controller, flush}) {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return () => {};
      }

      const abortForBackground = (reason) => {
        if (!abortOnBackground) return;
        scheduleResumeAlert();
        abortGenerationController(controller, reason);
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

      document.addEventListener("visibilitychange", handleVisibilityChange, {
        capture: true,
      });
      window.addEventListener("pagehide", handlePageHide, {capture: true});
      window.addEventListener("freeze", handleFreeze, {capture: true});
      window.addEventListener("pageshow", handleFocus, {capture: true});
      window.addEventListener("focus", handleFocus, {capture: true});

      return () => {
        if (!pendingResumeAlert) {
          clearResumeAlertListeners();
        }

        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
          {capture: true}
        );
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
