import {runSseGenerationStream} from "@/api/sse/common/streamGenerationCore";
import {createDesktopSseLifecycle} from "@/api/sse/browser/desktop/desktopLifecycle";
import {createStreamRequestContext} from "@/api/sse/common/streamRequest";

export async function streamGenerationDesktop(payload = {}, handlers = {}) {
  const context = createStreamRequestContext();

  try {
    return await runSseGenerationStream({
      payload,
      handlers,
      controller: context.controller,
      lifecycle: createDesktopSseLifecycle(),
    });
  } finally {
    context.cleanup();
  }
}
