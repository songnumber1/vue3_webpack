import {shouldUseServerApi} from "@/constants/apiMode";
import {pickGenerationSample} from "@/api/mock/data/generationSamples.raw";
import {streamText} from "@/api/mock/fakeStream";
import {isGenerationAbortError} from "@/api/sse/common/sseErrors";
import {resolveStreamRuntimeType} from "@/platform/runtime/runtimeDetector";
import {STREAM_RUNTIME_TYPES} from "@/platform/runtime/runtimeTypes";
import {logPlatformDebug} from "@/platform/platformDebug";
import {streamGenerationDesktop} from "@/api/sse/browser/desktop/streamGenerationDesktop";
import {streamGenerationChrome} from "@/api/sse/browser/chrome/streamGenerationChrome";
import {streamGenerationAndroidWebView} from "@/api/sse/webview/android/streamGenerationAndroidWebView";

export {isGenerationAbortError};

function resolveRequestId(payload = {}) {
  return payload?.requestId || payload?.request_id || "";
}

async function streamGenerationMock(payload = {}, handlers = {}) {
  const {onChunk, onComplete} = handlers;
  const text = pickGenerationSample(payload.input);
  const requestId = resolveRequestId(payload);

  await streamText(text, (chunk) => onChunk?.(chunk), {delay: 18});
  await onComplete?.({requestId});

  return {
    completed: true,
    requestId,
    accumulated: text,
    runtimeType: "mock",
  };
}

export async function streamGeneration(payload = {}, handlers = {}) {
  if (!shouldUseServerApi()) return streamGenerationMock(payload, handlers);

  const runtimeType = resolveStreamRuntimeType();

  logPlatformDebug("sse.route", {runtimeType});

  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW) {
    return streamGenerationAndroidWebView(payload, handlers);
  }

  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_CHROME) {
    return streamGenerationChrome(payload, handlers);
  }

  return streamGenerationDesktop(payload, handlers);
}
