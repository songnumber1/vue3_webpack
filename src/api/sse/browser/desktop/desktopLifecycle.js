import {createAbortError} from "@/api/sse/common/sseErrors";

function abortController(controller, reason) {
  if (!controller || controller.signal.aborted) return;

  const abortReason = createAbortError(reason);
  try {
    controller.abort(abortReason);
  } catch (_error) {
    controller.abort();
  }
}

export function createDesktopSseLifecycle() {
  return {
    install({controller}) {
      if (typeof window === "undefined") return () => {};

      const handlePageEnd = () => {
        abortController(controller, "page lifecycle ended");
      };

      window.addEventListener("pagehide", handlePageEnd, {capture: true});
      window.addEventListener("beforeunload", handlePageEnd, {capture: true});

      return () => {
        window.removeEventListener("pagehide", handlePageEnd, {capture: true});
        window.removeEventListener("beforeunload", handlePageEnd, {
          capture: true,
        });
      };
    },

    onAccumulated({accumulated, committer}) {
      committer.update(accumulated);
    },
  };
}
