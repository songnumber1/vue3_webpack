import {runSseGenerationStream} from "@/api/sse/common/streamGenerationCore";
import {createAndroidWebViewSseLifecycle} from "@/api/sse/webview/android/androidWebViewLifecycle";
import {createStreamRequestContext} from "@/api/sse/common/streamRequest";

export async function streamGenerationAndroidWebView(payload = {}, handlers = {}) {
  const context = createStreamRequestContext();
  try {
    return await runSseGenerationStream({
      payload,
      handlers,
      controller: context.controller,
      lifecycle: createAndroidWebViewSseLifecycle(),
    });
  } finally {
    context.cleanup();
  }
}
