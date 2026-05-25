/**
 * @file platform/bridge/bridgeUtils.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export function createRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function createIsoDate() {
  return new Date().toISOString();
}

export function createBridgeRequest(payload = {}) {
  return {
    requestId: payload.requestId || createRequestId(),
    requestDate: payload.requestDate || createIsoDate(),
    ...payload,
  };
}

export function parseNativePayload(payload) {
  if (typeof payload !== "string") return payload || {};

  try {
    return payload ? JSON.parse(payload) : {};
  } catch (error) {
    return {rawPayload: payload};
  }
}
