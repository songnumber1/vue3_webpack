/**
 * @file api/sse/browser/desktop/desktopLifecycle.js
 * @description SSE 스트리밍 계층입니다. fetch ReadableStream, data: frame 파싱, chunk commit, 모바일 lifecycle abort를 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {createAbortError} from "@/api/sse/common/sseErrors";
import {logWarn} from "@/utils/logger";

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
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
