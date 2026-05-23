import {createAbortError} from "@/api/sse/common/sseErrors";
import {logWarn} from "@/utils/logger";

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
      logWarn("[desktopLifecycle] reader cancel failed:", error);
    });
  }
}

export function createDesktopSseLifecycle() {
  return {
    install({controller, getReader}) {
      if (typeof window === "undefined") return () => {};

      const handlePageEnd = () => {
        abortController(controller, getReader, "page lifecycle ended");
      };

      window.addEventListener("pagehide", handlePageEnd, {capture: true});
      window.addEventListener("beforeunload", handlePageEnd, {capture: true});

      return () => {
        window.removeEventListener("pagehide", handlePageEnd, {capture: true});
        window.removeEventListener("beforeunload", handlePageEnd, {capture: true});
      };
    },

    onAccumulated({accumulated, committer}) {
      committer.update(accumulated);
    },
  };
}
