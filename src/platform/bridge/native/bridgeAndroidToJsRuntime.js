/**
 * @file platform/bridge/native/bridgeAndroidToJsRuntime.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {getActivePinia} from "pinia";
import {usePlatformStore} from "@/stores/platformStore";
import {logWarn} from "@/utils/logger";
import {AndroidToJsContract} from "../contract";
import {
  createAndroidToJsFallbackError,
  createNativeDispatchRequiredResponse,
  createSuccessResponse,
} from "../runtime/bridgeResponses";
import {createResponseError} from "../bridgeErrors";
import {createBridgeRequest, parseNativePayload} from "../bridgeUtils";
import {
  validateBridgeRequest,
  validateBridgeResponse,
} from "../bridgeValidation";

export function rejectAndroidToJsSwaggerExecution(type, payload = {}) {
  let request;

  try {
    request = validateBridgeRequest(type, payload, AndroidToJsContract);
  } catch (error) {
    return Promise.reject(error);
  }

  return Promise.reject(
    createResponseError(
      createNativeDispatchRequiredResponse(request, type),
      501
    )
  );
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function recordNativeEvent(type, request) {
  try {
    const activePinia = getActivePinia();
    if (activePinia) {
      usePlatformStore(activePinia).recordNativeEvent(type, request);
    } else {
      window.__pendingNativeEvents = window.__pendingNativeEvents || [];
      window.__pendingNativeEvents.push({type, payload: request});
    }
  } catch (error) {
    window.__pendingNativeEvents = window.__pendingNativeEvents || [];
    window.__pendingNativeEvents.push({type, payload: request});
    logWarn("Failed to record native event.", error);
  }
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function dispatchNativeEvent(type, request) {
  window.dispatchEvent(
    new CustomEvent("android-to-js", {
      detail: {
        type,
        payload: request,
      },
    })
  );

  const globalHandlerName = `__${type}`;
  const globalHandler = window[globalHandlerName];

  if (typeof globalHandler === "function") {
    globalHandler(request);
  }
}

export function receiveNativeEvent(type, payload = {}) {
  const request = validateBridgeRequest(
    type,
    parseNativePayload(payload),
    AndroidToJsContract
  );

  recordNativeEvent(type, request);
  dispatchNativeEvent(type, request);

  const response = createSuccessResponse(
    request,
    {
      handled: true,
      eventName: type,
    },
    "Android Native가 호출한 JS 이벤트를 수신했습니다.",
    {category: "android-to-js", runtime: "native-dispatch"}
  );

  return validateBridgeResponse(type, response, AndroidToJsContract, request);
}

export function createNativeEventHandler(type) {
  return (payload = {}) => {
    try {
      const response = receiveNativeEvent(type, payload);
      return JSON.stringify(response);
    } catch (error) {
      return JSON.stringify(
        error?.response ||
          createAndroidToJsFallbackError(parseNativePayload(payload), error)
      );
    }
  };
}

export function receiveNativeEventAsJson(type, payload = {}) {
  try {
    return JSON.stringify(receiveNativeEvent(type, payload));
  } catch (error) {
    return JSON.stringify(
      error?.response ||
        createAndroidToJsFallbackError(
          createBridgeRequest(parseNativePayload(payload)),
          error
        )
    );
  }
}

export function registerAndroidToJsGlobalHandlers() {
  window.__receiveNativeEvent = receiveNativeEventAsJson;
  window.onAppResume = createNativeEventHandler("ON_APP_RESUME");
  window.onBackPressed = createNativeEventHandler("ON_BACK_PRESSED");
  window.onFileSelected = createNativeEventHandler("ON_FILE_SELECTED");
  window.onNetworkChange = createNativeEventHandler("ON_NETWORK_CHANGE");
  window.onPushClick = createNativeEventHandler("ON_PUSH_CLICK");
  window.onSessionExpired = createNativeEventHandler("ON_SESSION_EXPIRED");
  window.onAppPause = createNativeEventHandler("ON_APP_PAUSE");
  window.onWebViewClose = createNativeEventHandler("ON_WEBVIEW_CLOSE");
  window.onRequestCancel = createNativeEventHandler("ON_REQUEST_CANCEL");
  window.onNativeError = createNativeEventHandler("ON_NATIVE_ERROR");
}
