/**
 * @file api/sse/common/sseErrors.js
 * @description SSE 스트리밍 계층입니다. fetch ReadableStream, data: frame 파싱, chunk commit, 모바일 lifecycle abort를 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export function isGenerationAbortError(error) {
  const message = String(error?.message || error || "");
  return (
    error?.name === "AbortError" ||
    error?.code === 20 ||
    /aborted|abort|page lifecycle ended|page lifecycle frozen|mobile page hidden|mobile page frozen|mobile page unloading|android app pause|ERR_CONNECTION_ABORTED|network error|networkerror|failed to fetch|load failed/i.test(message)
  );
}

export function createAbortError(reason) {
  if (typeof DOMException !== "undefined") {
    return new DOMException(reason || "Aborted", "AbortError");
  }
  const error = new Error(reason || "Aborted");
  error.name = "AbortError";
  return error;
}
