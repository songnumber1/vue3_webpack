/**
 * @file platform/bridge/bridgeErrors.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {createErrorResponse} from "./runtime/bridgeResponses";

export function createContractError(
  request,
  message,
  code,
  status = 400,
  meta = {}
) {
  const errorResponse = createErrorResponse(request, message, code);
  errorResponse.meta = {
    ...errorResponse.meta,
    ...meta,
    status,
  };

  const error = new Error(message);
  error.response = errorResponse;
  error.status = status;
  return error;
}

export function createResponseError(errorResponse, fallbackStatus = 500) {
  const error = new Error(
    errorResponse.message ||
      errorResponse.error?.detail ||
      "Bridge response error"
  );
  error.response = errorResponse;
  error.status = errorResponse.meta?.status || fallbackStatus;
  return error;
}
