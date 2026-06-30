import {abortGenerationController} from "@/api/sse/common/sseErrors";

export function createMobileBrowserSseLifecycle() {
  return {
    install({controller}) {
      if (typeof window === "undefined") return () => {};

      const handlePageEnd = () => {
        abortGenerationController(controller, "mobile browser lifecycle ended");
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
