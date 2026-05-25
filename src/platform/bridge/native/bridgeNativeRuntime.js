/**
 * @file platform/bridge/native/bridgeNativeRuntime.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {JsToAndroidContract} from "../contract";
import {BRIDGE_TIMEOUT} from "../bridgeConstants";
import {
  callDirectAndroidBridge,
  hasDirectAndroidBridge,
  hasPostMessageBridge,
  postAndroidBridgeMessage,
} from "./bridgeAndroidTransport";
import {
  completeBridgeResponse,
  deleteBridgeCallback,
  setBridgeCallback,
} from "../runtime/bridgeCallbackRegistry";
import {
  createBridgeUnavailableResponse,
  createErrorResponse,
  normalizeBridgeResponse,
} from "../runtime/bridgeResponses";
import {
  throwIfErrorResponse,
  validateBridgeRequest,
  validateBridgeResponse,
} from "../bridgeValidation";

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function rejectWithBridgeResponse(reject, response) {
  const error = new Error(response.message);
  error.response = response;
  error.status = response.meta?.status || 500;
  reject(error);
}

/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createNativeRequestErrorResponse(validPayload, error, type) {
  const errorResponse = createErrorResponse(
    validPayload,
    error,
    "ANDROID_BRIDGE_ERROR"
  );
  errorResponse.meta = {
    ...errorResponse.meta,
    type,
    phase: "request",
    status: 500,
  };
  return errorResponse;
}

export function callNative(type, payload, timeout = BRIDGE_TIMEOUT) {
  return new Promise((resolve, reject) => {
    let validPayload;

    try {
      validPayload = validateBridgeRequest(type, payload, JsToAndroidContract);
    } catch (error) {
      reject(error);
      return;
    }

    const {requestId} = validPayload;
    const canUsePostMessage = hasPostMessageBridge();
    const canUseDirectMethod = hasDirectAndroidBridge(type);

    if (!canUsePostMessage && !canUseDirectMethod) {
      rejectWithBridgeResponse(
        reject,
        createBridgeUnavailableResponse(validPayload, type)
      );
      return;
    }

    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;

      settled = true;
      deleteBridgeCallback(requestId);

      const errorResponse = createErrorResponse(
        validPayload,
        "AndroidBridge 응답 대기 시간이 초과되었습니다.",
        "ANDROID_BRIDGE_TIMEOUT"
      );
      errorResponse.meta = {
        ...errorResponse.meta,
        type,
        phase: "response",
        status: 504,
      };
      rejectWithBridgeResponse(reject, errorResponse);
    }, timeout);

    setBridgeCallback(requestId, (rawResponse) => {
      if (settled) return;

      settled = true;
      window.clearTimeout(timer);
      deleteBridgeCallback(requestId);

      try {
        const response = normalizeBridgeResponse(rawResponse, validPayload);
        throwIfErrorResponse(type, response, JsToAndroidContract);
        resolve(
          validateBridgeResponse(
            type,
            response,
            JsToAndroidContract,
            validPayload
          )
        );
      } catch (error) {
        reject(error);
      }
    });

    if (canUsePostMessage) {
      try {
        const rawResponse = postAndroidBridgeMessage({
          requestId,
          type,
          payload: validPayload,
        });
        if (rawResponse) {
          completeBridgeResponse(
            normalizeBridgeResponse(rawResponse, validPayload)
          );
        }
      } catch (error) {
        completeBridgeResponse(
          createNativeRequestErrorResponse(validPayload, error, type)
        );
      }
      return;
    }

    callDirectAndroidBridge(type, validPayload)
      .then((rawResponse) => {
        completeBridgeResponse(
          normalizeBridgeResponse(rawResponse, validPayload)
        );
      })
      .catch((error) => {
        completeBridgeResponse(
          createNativeRequestErrorResponse(validPayload, error, type)
        );
      });
  });
}
