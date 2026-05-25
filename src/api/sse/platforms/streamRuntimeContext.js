import {resolveStreamRuntimeType} from "@/platform/runtime/runtimeDetector";
import {STREAM_RUNTIME_TYPES} from "@/platform/runtime/runtimeTypes";
import {logPlatformDebug} from "@/platform/platformDebug";
import {createStreamRequestContext} from "@/api/sse/common/streamRequest";
import {createDesktopSseLifecycle} from "@/api/sse/browser/desktop/desktopLifecycle";
import {createChromeSseLifecycle} from "@/api/sse/browser/chrome/chromeLifecycle";
import {createAndroidWebViewSseLifecycle} from "@/api/sse/webview/android/androidWebViewLifecycle";

function createLifecycle(runtimeType) {
  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW) {
    return createAndroidWebViewSseLifecycle();
  }

  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_CHROME) {
    return createChromeSseLifecycle();
  }

  return createDesktopSseLifecycle();
}

export function createSseRuntimeContext() {
  const runtimeType = resolveStreamRuntimeType();
  const requestContext = createStreamRequestContext();
  const lifecycle = createLifecycle(runtimeType);

  logPlatformDebug("sse.context", {
    runtimeType,
    requestKey: requestContext.requestKey,
    overlay: requestContext.overlay,
    abort: Boolean(requestContext.controller),
  });

  return {
    runtimeType,
    controller: requestContext.controller,
    lifecycle,
    cleanup: requestContext.cleanup,
  };
}
