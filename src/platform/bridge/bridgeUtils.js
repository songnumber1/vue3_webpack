import {createId} from "@/utils/id";

/**
 * @file platform/bridge/bridgeUtils.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 */

export function createRequestId() {
  return createId();
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
