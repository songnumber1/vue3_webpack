function isDocumentHidden() {}

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
      if (paused || isDocumentHidden()) backlogPending = true;

      committer.update(accumulated);
    },
  };
}
