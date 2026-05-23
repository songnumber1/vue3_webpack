import {runSseGenerationStream} from "@/api/sse/common/streamGenerationCore";
import {createChromeSseLifecycle} from "@/api/sse/browser/chrome/chromeLifecycle";
import {createStreamRequestContext} from "@/api/sse/common/streamRequest";

export async function streamGenerationChrome(payload = {}, handlers = {}) {
  const context = createStreamRequestContext();
  try {
    return await runSseGenerationStream({
      payload,
      handlers,
      controller: context.controller,
      lifecycle: createChromeSseLifecycle(),
    });
  } finally {
    context.cleanup();
  }
}
