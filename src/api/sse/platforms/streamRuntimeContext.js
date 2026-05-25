/**
 * @file api/sse/platforms/streamRuntimeContext.js
 * @description SSE 스트리밍 계층입니다. fetch ReadableStream, data: frame 파싱, chunk commit, 모바일 lifecycle abort를 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {resolveStreamRuntimeType} from "@/platform/runtime/runtimeDetector";
import {STREAM_RUNTIME_TYPES} from "@/platform/runtime/runtimeTypes";
import {logPlatformDebug} from "@/platform/platformDebug";
import {createStreamRequestContext} from "@/api/sse/common/streamRequest";
import {createDesktopSseLifecycle} from "@/api/sse/browser/desktop/desktopLifecycle";
import {createChromeSseLifecycle} from "@/api/sse/browser/chrome/chromeLifecycle";
import {createAndroidWebViewSseLifecycle} from "@/api/sse/webview/android/androidWebViewLifecycle";

/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
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
