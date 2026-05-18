import {getActivePinia} from "pinia";
import {usePlatformStore} from "@/stores/platformStore";
import {logWarn} from "@/utils/logger";
import {AndroidToJsContract} from "./contract";
import {
  createAndroidToJsFallbackError,
  createNativeDispatchRequiredResponse,
  createSuccessResponse,
} from "./bridgeResponses";
import {createResponseError} from "./bridgeErrors";
import {createBridgeRequest, parseNativePayload} from "./bridgeUtils";
import {
  validateBridgeRequest,
  validateBridgeResponse,
} from "./bridgeValidation";

export function rejectAndroidToJsSwaggerExecution(type, payload = {}) {
  let request;

  try {
    request = validateBridgeRequest(type, payload, AndroidToJsContract);
  } catch (error) {
    return Promise.reject(error);
  }

  return Promise.reject(
    createResponseError(createNativeDispatchRequiredResponse(request, type), 501)
  );
}

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
          createAndroidToJsFallbackError(
            parseNativePayload(payload),
            error
          )
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
