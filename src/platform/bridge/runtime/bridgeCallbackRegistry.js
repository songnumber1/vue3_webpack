/**
 * @file platform/bridge/runtime/bridgeCallbackRegistry.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

const callbacks = {};

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function extractRequestId(rawResponse) {
  if (typeof rawResponse !== "string") return rawResponse?.requestId;

  try {
    return JSON.parse(rawResponse)?.requestId;
  } catch (error) {
    return null;
  }
}

export function setBridgeCallback(requestId, callback) {
  callbacks[requestId] = callback;
}

export function deleteBridgeCallback(requestId) {
  delete callbacks[requestId];
}

export function getBridgeCallback(requestId) {
  return callbacks[requestId];
}

export function completeBridgeResponse(rawResponse) {
  const requestId = extractRequestId(rawResponse);

  if (!requestId) return;

  const callback = getBridgeCallback(requestId);

  if (!callback) return;

  callback(rawResponse);
}
