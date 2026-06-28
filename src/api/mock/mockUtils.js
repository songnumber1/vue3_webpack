/**
 * @file api/mock/mockUtils.js
 * @description 개발/데모용 mock API 또는 mock 데이터입니다. 실제 API 비활성화 시 화면 동작을 보장합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export function cloneMockData(value) {
  if (typeof structuredClone === "function") return structuredClone(value);

  return JSON.parse(JSON.stringify(value));
}
function createAbortError() {
  const error = new Error("The mock request was aborted.");
  error.name = "AbortError";
  return error;
}

export function mockDelay(ms = 120, options = {}) {
  const {signal} = options;

  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      signal?.removeEventListener?.("abort", handleAbort);
    };
    const handleAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(createAbortError());
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    signal?.addEventListener?.("abort", handleAbort, {once: true});
  });
}
export async function resolveMock(value, delay = 120, options = {}) {
  await mockDelay(delay, options);

  return cloneMockData(value);
}
