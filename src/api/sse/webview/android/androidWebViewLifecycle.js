function isDocumentHidden() {
  return typeof document !== "undefined" && document.hidden;
}

export function createAndroidWebViewSseLifecycle() {
  let paused = false;
  let backlogPending = false;

  return {
    install({flush}) {
      if (typeof window === "undefined") return () => {};

      const handlePause = () => {
        paused = true;
        backlogPending = true;
      };

      const handleResume = () => {
        paused = false;
        if (backlogPending) {
          backlogPending = false;
          flush?.();
        }
      };

      window.addEventListener("apppause", handlePause, {capture: true});
      window.addEventListener("appresume", handleResume, {capture: true});

      return () => {
        window.removeEventListener("apppause", handlePause, {capture: true});
        window.removeEventListener("appresume", handleResume, {capture: true});
      };
    },

    onAccumulated({accumulated, committer}) {
      // Android 13+ WebView는 native lifecycle에서 복귀를 통지받을 수 있으므로
      // 수신 데이터는 항상 최신 상태로 commit 예약하고, 실제 복귀 시 flush를 한 번 더 보장합니다.
      if (paused || isDocumentHidden()) backlogPending = true;
      committer.update(accumulated);
    },
  };
}
