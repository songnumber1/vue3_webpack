import {
  AndroidToJsContract,
  BridgeContract,
  JsToAndroidContract,
  WebApiContract,
} from "./contract";
import {BRIDGE_CATEGORY, BRIDGE_TIMEOUT} from "./bridgeConstants";
import {usePlatformStore} from "@/stores/platformStore";

const callbacks = {};

function createRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function createIsoDate() {
  return new Date().toISOString();
}

function getContract(type, contractMap = BridgeContract) {
  const contract = contractMap[type];

  if (!contract) {
    throw new Error(`Unknown bridge type: ${type}`);
  }

  return contract;
}

function formatZodIssues(error) {
  return error?.errors
    ?.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join(", ") || "Unknown schema validation error";
}

function createContractError(request, message, code, status = 400, meta = {}) {
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

function safeParseBySchema(schema, value, request, options) {
  const parsed = schema.safeParse(value || {});

  if (!parsed.success) {
    const detail = formatZodIssues(parsed.error);
    throw createContractError(
      request,
      `${options.message}: ${detail}`,
      options.code,
      options.status,
      options.meta
    );
  }

  return parsed.data;
}

function createBridgeRequest(payload = {}) {
  return {
    requestId: payload.requestId || createRequestId(),
    requestDate: payload.requestDate || createIsoDate(),
    ...payload,
  };
}

function validateBridgeRequest(type, payload, contractMap = BridgeContract) {
  const contract = getContract(type, contractMap);
  const request = createBridgeRequest(payload);

  return safeParseBySchema(contract.request, request, request, {
    code: "INVALID_BRIDGE_REQUEST",
    status: 400,
    message: `Invalid bridge request payload: ${type}`,
    meta: {type, phase: "request"},
  });
}

function validateBridgeResponse(type, data, contractMap = BridgeContract, fallbackRequest = {}) {
  const contract = getContract(type, contractMap);
  const request = {
    requestId: data?.requestId || fallbackRequest?.requestId,
    requestDate: data?.requestDate || fallbackRequest?.requestDate,
  };

  return safeParseBySchema(contract.response, data, request, {
    code: "INVALID_BRIDGE_RESPONSE",
    status: 500,
    message: `Invalid bridge response payload: ${type}`,
    meta: {type, phase: "response"},
  });
}

function validateBridgeErrorResponse(type, data, contractMap = BridgeContract, fallbackRequest = {}) {
  const contract = getContract(type, contractMap);
  const request = {
    requestId: data?.requestId || fallbackRequest?.requestId,
    requestDate: data?.requestDate || fallbackRequest?.requestDate,
  };

  return safeParseBySchema(contract.error, data, request, {
    code: "INVALID_BRIDGE_ERROR_RESPONSE",
    status: 500,
    message: `Invalid bridge error response payload: ${type}`,
    meta: {type, phase: "error-response"},
  });
}


function getAndroidBridgeMethodName(type) {
  const methodMap = {
    OPEN_EXTERNAL_BROWSER: "openExternalBrowser",
    OPEN_FILE_PICKER: "openFilePicker",
    GET_PUSH_TOKEN: "getPushToken",
    GET_APP_VERSION: "getAppVersion",
    COPY_CLIPBOARD: "copyClipboard",
    SHARE: "share",
    CHECK_NETWORK: "checkNetwork",
    GET_STORAGE: "getStorage",
    SET_STORAGE: "setStorage",
    CANCEL_REQUEST: "cancelRequest",
    SET_BACK_HANDLER: "setBackHandler",
    SHOW_TOAST: "showToast",
    GET_DEVICE_INFO: "getDeviceInfo",
    WRITE_LOG: "writeLog",
    CLOSE_APP: "closeApp",
  };

  return methodMap[type];
}

function getAndroidBridge() {
  return window.AndroidBridge || null;
}

function hasPostMessageBridge() {
  return typeof getAndroidBridge()?.postMessage === "function";
}

function hasDirectAndroidBridge(type) {
  const methodName = getAndroidBridgeMethodName(type);
  const bridge = getAndroidBridge();

  return Boolean(bridge && methodName && typeof bridge[methodName] === "function");
}

function callDirectAndroidBridge(type, payload) {
  const methodName = getAndroidBridgeMethodName(type);
  const bridge = getAndroidBridge();

  if (!bridge || !methodName || typeof bridge[methodName] !== "function") {
    return null;
  }

  const raw = bridge[methodName](JSON.stringify(payload));
  return Promise.resolve(raw);
}

function createBridgeUnavailableResponse(request, type) {
  const response = createErrorResponse(
    request,
    `AndroidBridge가 없어 ${type} 요청을 실제 Native로 전달할 수 없습니다. Windows/Web 브라우저에서는 성공 mock을 반환하지 않습니다.`,
    "ANDROID_BRIDGE_UNAVAILABLE"
  );
  response.meta = {
    ...response.meta,
    type,
    phase: "native-bridge",
    status: 503,
  };
  return response;
}

function parseNativePayload(payload) {
  if (typeof payload !== "string") return payload || {};

  try {
    return payload ? JSON.parse(payload) : {};
  } catch (error) {
    return {rawPayload: payload};
  }
}

function createSuccessResponse(request, data, message = "정상 처리되었습니다.", meta = {}) {
  return {
    requestId: request.requestId,
    requestDate: request.requestDate,
    responseDate: createIsoDate(),
    isSuccess: true,
    code: "SUCCESS",
    data,
    message,
    meta,
  };
}

function createErrorResponse(request, error, code = "BRIDGE_ERROR") {
  const message = error instanceof Error ? error.message : String(error || "Bridge response error");

  return {
    requestId: request?.requestId || createRequestId(),
    requestDate: request?.requestDate || createIsoDate(),
    responseDate: createIsoDate(),
    isSuccess: false,
    code,
    data: null,
    message,
    meta: {},
    error: {
      type: code,
      detail: message,
    },
  };
}

function normalizeBridgeResponse(response, request) {
  if (typeof response === "string") {
    try {
      return JSON.parse(response);
    } catch (error) {
      return createErrorResponse(request, "Invalid bridge response JSON", "INVALID_JSON");
    }
  }

  if (!response) {
    return createErrorResponse(request, "Empty bridge response", "EMPTY_RESPONSE");
  }

  if (typeof response.isSuccess === "boolean") {
    return response;
  }

  if (response.error) {
    return createErrorResponse(
      {
        requestId: response.requestId || request?.requestId,
        requestDate: response.requestDate || request?.requestDate,
      },
      response.error,
      "BRIDGE_ERROR"
    );
  }

  return createSuccessResponse(
    {
      requestId: response.requestId || request?.requestId,
      requestDate: response.requestDate || request?.requestDate,
    },
    response.data ?? response
  );
}

function completeBridgeResponse(rawResponse) {
  const requestId = typeof rawResponse === "string"
    ? (() => {
        try {
          return JSON.parse(rawResponse)?.requestId;
        } catch (error) {
          return null;
        }
      })()
    : rawResponse?.requestId;

  if (!requestId) return;

  const callback = callbacks[requestId];

  if (!callback) return;

  callback(rawResponse);
}

function throwIfErrorResponse(type, response, contractMap) {
  if (response.isSuccess) return;

  const errorResponse = validateBridgeErrorResponse(type, response, contractMap, response);
  const error = new Error(errorResponse.message || errorResponse.error?.detail || "Bridge response error");
  error.response = errorResponse;
  error.status = errorResponse.meta?.status || response.meta?.status || 500;
  throw error;
}


function getApiBaseUrl() {
  const configured = process.env.VUE_APP_API_BASE_URL || "/api";
  return configured.replace(/\/$/, "");
}

function interpolatePath(path, payload) {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, key) => encodeURIComponent(payload?.[key] ?? ""));
}

function buildBackendUrl(contract, payload) {
  const rawPath = contract.httpPath || `/${contract.type?.toLowerCase?.() || ""}`;
  const path = interpolatePath(rawPath, payload);
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function pickRequestBody(method, request) {
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod === "GET" || normalizedMethod === "HEAD") {
    return undefined;
  }

  return JSON.stringify(request);
}

async function parseBackendBody(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!text) return null;

  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function normalizeBackendSuccess(request, backendBody, contract) {
  if (backendBody && typeof backendBody === "object" && typeof backendBody.isSuccess === "boolean") {
    return backendBody;
  }

  return createSuccessResponse(
    request,
    backendBody,
    "Backend API를 실제 호출한 결과입니다.",
    {
      category: BRIDGE_CATEGORY.WEB_API,
      runtime: "backend",
      endpoint: contract.httpPath,
      method: contract.httpMethod,
    }
  );
}

function normalizeBackendError(request, response, backendBody, contract) {
  const status = response?.status || 500;
  const statusText = response?.statusText || "Backend Error";
  const backendMessage = backendBody?.message || backendBody?.error || backendBody?.detail;
  const error = createErrorResponse(
    request,
    backendMessage || `${status} ${statusText}`,
    `HTTP_${status}`
  );

  error.meta = {
    category: BRIDGE_CATEGORY.WEB_API,
    runtime: "backend",
    endpoint: contract.httpPath,
    method: contract.httpMethod,
    status,
    statusText,
    raw: backendBody,
  };

  return error;
}

async function requestBackend(type, request, contract) {
  const method = (contract.httpMethod || "POST").toUpperCase();
  const url = buildBackendUrl(contract, request);
  const response = await window.fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: pickRequestBody(method, request),
  });
  const backendBody = await parseBackendBody(response);

  if (!response.ok) {
    return normalizeBackendError(request, response, backendBody, contract);
  }

  return normalizeBackendSuccess(request, backendBody, contract);
}

export async function executeWebApi(type, payload = {}) {
  const contract = getContract(type, WebApiContract);
  const request = createBridgeRequest(payload);

  try {
    const response = await requestBackend(type, request, contract);

    if (!response.isSuccess) {
      throwIfErrorResponse(type, response, WebApiContract);
    }

    // REST/Web API는 backend contract를 신뢰한다.
    // JS ↔ Android boundary와 달리 zod safeParse를 강제하지 않고 실제 backend 응답을 그대로 표준 envelope로 반환한다.
    return response;
  } catch (error) {
    if (error?.response) throw error;

    const errorResponse = createErrorResponse(request, error, "BACKEND_CALL_ERROR");
    errorResponse.meta = {
      category: BRIDGE_CATEGORY.WEB_API,
      runtime: "backend",
      endpoint: contract.httpPath,
      method: contract.httpMethod,
      status: 500,
    };

    throwIfErrorResponse(type, errorResponse, WebApiContract);
    return errorResponse;
  }
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
      const errorResponse = createBridgeUnavailableResponse(validPayload, type);
      const error = new Error(errorResponse.message);
      error.response = errorResponse;
      error.status = errorResponse.meta?.status || 503;
      reject(error);
      return;
    }

    let settled = false;

    const timer = window.setTimeout(() => {
      if (settled) return;

      settled = true;
      delete callbacks[requestId];

      const errorResponse = createErrorResponse(validPayload, "AndroidBridge 응답 대기 시간이 초과되었습니다.", "ANDROID_BRIDGE_TIMEOUT");
      errorResponse.meta = {
        ...errorResponse.meta,
        type,
        phase: "response",
        status: 504,
      };
      const error = new Error(errorResponse.message);
      error.response = errorResponse;
      error.status = 504;
      reject(error);
    }, timeout);

    callbacks[requestId] = (rawResponse) => {
      if (settled) return;

      settled = true;
      window.clearTimeout(timer);
      delete callbacks[requestId];

      try {
        const response = normalizeBridgeResponse(rawResponse, validPayload);
        throwIfErrorResponse(type, response, JsToAndroidContract);
        resolve(validateBridgeResponse(type, response, JsToAndroidContract, validPayload));
      } catch (error) {
        reject(error);
      }
    };

    if (canUsePostMessage) {
      try {
        getAndroidBridge().postMessage(
          JSON.stringify({
            requestId,
            type,
            payload: validPayload,
          })
        );
      } catch (error) {
        const errorResponse = createErrorResponse(validPayload, error, "ANDROID_BRIDGE_ERROR");
        errorResponse.meta = {
          ...errorResponse.meta,
          type,
          phase: "request",
          status: 500,
        };
        completeBridgeResponse(errorResponse);
      }
      return;
    }

    callDirectAndroidBridge(type, validPayload)
      .then((rawResponse) => {
        completeBridgeResponse(normalizeBridgeResponse(rawResponse, validPayload));
      })
      .catch((error) => {
        const errorResponse = createErrorResponse(validPayload, error, "ANDROID_BRIDGE_ERROR");
        errorResponse.meta = {
          ...errorResponse.meta,
          type,
          phase: "request",
          status: 500,
        };
        completeBridgeResponse(errorResponse);
      });
  });
}

export function rejectAndroidToJsSwaggerExecution(type, payload = {}) {
  let request;

  try {
    request = validateBridgeRequest(type, payload, AndroidToJsContract);
  } catch (error) {
    return Promise.reject(error);
  }

  const errorResponse = createErrorResponse(
    request,
    `${type}는 Android Native가 WebView의 JS 함수를 호출해야 하는 이벤트입니다. Swagger/Web 화면에서 성공 mock으로 실행하지 않습니다. Android에서 window.onAppResume/onBackPressed/onPushClick 또는 window.__receiveNativeEvent를 호출해 테스트해야 합니다.`,
    "ANDROID_TO_JS_REQUIRES_NATIVE_DISPATCH"
  );
  errorResponse.meta = {
    ...errorResponse.meta,
    type,
    phase: "native-dispatch",
    status: 501,
  };

  const error = new Error(errorResponse.message);
  error.response = errorResponse;
  error.status = 501;
  return Promise.reject(error);
}

export function receiveNativeEvent(type, payload = {}) {
  const request = validateBridgeRequest(type, parseNativePayload(payload), AndroidToJsContract);

  try {
    usePlatformStore().recordNativeEvent(type, request);
  } catch (error) {
    // Pinia가 초기화되기 전 Native 이벤트가 도착해도 bridge 응답은 유지합니다.
    console.warn("Failed to record native event.", error);
  }

  window.dispatchEvent(new CustomEvent("android-to-js", {
    detail: {
      type,
      payload: request,
    },
  }));

  const globalHandlerName = `__${type}`;
  const globalHandler = window[globalHandlerName];

  if (typeof globalHandler === "function") {
    globalHandler(request);
  }

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

function createNativeEventHandler(type) {
  return (payload = {}) => {
    try {
      const response = receiveNativeEvent(type, payload);
      return JSON.stringify(response);
    } catch (error) {
      return JSON.stringify(
        error?.response ||
        createErrorResponse(createBridgeRequest(parseNativePayload(payload)), error, "ANDROID_TO_JS_ERROR")
      );
    }
  };
}

export function executeContract(category, type, payload = {}) {
  if (category === "web-api") return executeWebApi(type, payload);
  if (category === "js-to-android") return callNative(type, payload);
  if (category === "android-to-js") return rejectAndroidToJsSwaggerExecution(type, payload);
  return executeWebApi(type, payload);
}

window.__bridgeResponse = completeBridgeResponse;
window.__receiveNativeEvent = (type, payload = {}) => {
  try {
    return JSON.stringify(receiveNativeEvent(type, payload));
  } catch (error) {
    return JSON.stringify(
      error?.response ||
      createErrorResponse(createBridgeRequest(parseNativePayload(payload)), error, "ANDROID_TO_JS_ERROR")
    );
  }
};
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
