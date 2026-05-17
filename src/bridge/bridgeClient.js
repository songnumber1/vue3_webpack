import {
// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
  AndroidToJsContract,
  BridgeContract,
  JsToAndroidContract,
  WebApiContract,
} from "./contract";
import {BRIDGE_CATEGORY, BRIDGE_TIMEOUT} from "./bridgeConstants";
import {getActivePinia} from "pinia";
import {usePlatformStore} from "@/stores/platformStore";
import {logWarn} from "@/utils/logger";
import {
  completeRegisteredBridgeResponse,
  registerBridgeCallback,
  removeBridgeCallback,
} from "@/bridge/runtime/callbackRegistry";

/**
 * @description createRequestId 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createRequestId() {
  // 계산된 결과를 호출부로 반환합니다.
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * @description createIsoDate 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createIsoDate() {
  // 계산된 결과를 호출부로 반환합니다.
  return new Date().toISOString();
}

/**
 * @description getContract 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @param {*} contractMap - contractMap 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getContract(type, contractMap = BridgeContract) {
  const contract = contractMap[type];

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!contract) {
    throw new Error(`Unknown bridge type: ${type}`);
  }

  // 계산된 결과를 호출부로 반환합니다.
  return contract;
}

/**
 * @description formatZodIssues 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} error - error 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function formatZodIssues(error) {
  // 계산된 결과를 호출부로 반환합니다.
  return (
    error?.errors
      ?.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join(", ") || "Unknown schema validation error"
  );
}

/**
 * @description createContractError 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} request - request 입력값입니다.
 * @param {*} message - message 입력값입니다.
 * @param {*} code - code 입력값입니다.
 * @param {*} status - status 입력값입니다.
 * @param {*} meta - meta 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
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
  // 계산된 결과를 호출부로 반환합니다.
  return error;
}

/**
 * @description safeParseBySchema 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} schema - schema 입력값입니다.
 * @param {*} value - value 입력값입니다.
 * @param {*} request - request 입력값입니다.
 * @param {*} options - options 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function safeParseBySchema(schema, value, request, options) {
  const parsed = schema.safeParse(value || {});

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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

  // 계산된 결과를 호출부로 반환합니다.
  return parsed.data;
}

/**
 * @description createBridgeRequest 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createBridgeRequest(payload = {}) {
  // 계산된 결과를 호출부로 반환합니다.
  return {
    requestId: payload.requestId || createRequestId(),
    requestDate: payload.requestDate || createIsoDate(),
    ...payload,
  };
}

/**
 * @description validateBridgeRequest 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @param {*} payload - payload 입력값입니다.
 * @param {*} contractMap - contractMap 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function validateBridgeRequest(type, payload, contractMap = BridgeContract) {
  const contract = getContract(type, contractMap);
  const request = createBridgeRequest(payload);

  // 계산된 결과를 호출부로 반환합니다.
  return safeParseBySchema(contract.request, request, request, {
    code: "INVALID_BRIDGE_REQUEST",
    status: 400,
    message: `Invalid bridge request payload: ${type}`,
    meta: {type, phase: "request"},
  });
}

function validateBridgeResponse(
  type,
  data,
  contractMap = BridgeContract,
  fallbackRequest = {}
) {
  const contract = getContract(type, contractMap);
  const request = {
    requestId: data?.requestId || fallbackRequest?.requestId,
    requestDate: data?.requestDate || fallbackRequest?.requestDate,
  };

  // 계산된 결과를 호출부로 반환합니다.
  return safeParseBySchema(contract.response, data, request, {
    code: "INVALID_BRIDGE_RESPONSE",
    status: 500,
    message: `Invalid bridge response payload: ${type}`,
    meta: {type, phase: "response"},
  });
}

function validateBridgeErrorResponse(
  type,
  data,
  contractMap = BridgeContract,
  fallbackRequest = {}
) {
  const contract = getContract(type, contractMap);
  const request = {
    requestId: data?.requestId || fallbackRequest?.requestId,
    requestDate: data?.requestDate || fallbackRequest?.requestDate,
  };

  // 계산된 결과를 호출부로 반환합니다.
  return safeParseBySchema(contract.error, data, request, {
    code: "INVALID_BRIDGE_ERROR_RESPONSE",
    status: 500,
    message: `Invalid bridge error response payload: ${type}`,
    meta: {type, phase: "error-response"},
  });
}

/**
 * @description getAndroidBridgeMethodName 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
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
    REMOVE_STORAGE: "removeStorage",
    CANCEL_REQUEST: "cancelRequest",
    SET_BACK_HANDLER: "setBackHandler",
    SHOW_TOAST: "showToast",
    GET_DEVICE_INFO: "getDeviceInfo",
    WRITE_LOG: "writeLog",
    CLOSE_APP: "closeApp",
  };

  // 계산된 결과를 호출부로 반환합니다.
  return methodMap[type];
}

/**
 * @description getAndroidBridge 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getAndroidBridge() {
  // 계산된 결과를 호출부로 반환합니다.
  return window.AndroidBridge || null;
}

/**
 * @description hasPostMessageBridge 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function hasPostMessageBridge() {
  // 계산된 결과를 호출부로 반환합니다.
  return typeof getAndroidBridge()?.postMessage === "function";
}

/**
 * @description hasDirectAndroidBridge 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function hasDirectAndroidBridge(type) {
  const methodName = getAndroidBridgeMethodName(type);
  const bridge = getAndroidBridge();

  // 계산된 결과를 호출부로 반환합니다.
  return Boolean(
    bridge && methodName && typeof bridge[methodName] === "function"
  );
}

/**
 * @description callDirectAndroidBridge 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function callDirectAndroidBridge(type, payload) {
  const methodName = getAndroidBridgeMethodName(type);
  const bridge = getAndroidBridge();

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!bridge || !methodName || typeof bridge[methodName] !== "function") {
    // 계산된 결과를 호출부로 반환합니다.
    return null;
  }

  const raw = bridge[methodName](JSON.stringify(payload));
  // 계산된 결과를 호출부로 반환합니다.
  return Promise.resolve(raw);
}

/**
 * @description createBridgeUnavailableResponse 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} request - request 입력값입니다.
 * @param {*} type - type 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
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
  // 계산된 결과를 호출부로 반환합니다.
  return response;
}

/**
 * @description parseNativePayload 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function parseNativePayload(payload) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof payload !== "string") return payload || {};

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    // 계산된 결과를 호출부로 반환합니다.
    return payload ? JSON.parse(payload) : {};
  } catch (error) {
    // 계산된 결과를 호출부로 반환합니다.
    return {rawPayload: payload};
  }
}

function createSuccessResponse(
  request,
  data,
  message = "정상 처리되었습니다.",
  meta = {}
) {
  // 계산된 결과를 호출부로 반환합니다.
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

/**
 * @description createErrorResponse 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} request - request 입력값입니다.
 * @param {*} error - error 입력값입니다.
 * @param {*} code - code 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createErrorResponse(request, error, code = "BRIDGE_ERROR") {
  const message =
    error instanceof Error
      ? error.message
      : String(error || "Bridge response error");

  // 계산된 결과를 호출부로 반환합니다.
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

/**
 * @description normalizeBridgeResponse 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} response - response 입력값입니다.
 * @param {*} request - request 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function normalizeBridgeResponse(response, request) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof response === "string") {
    // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
    try {
      // 계산된 결과를 호출부로 반환합니다.
      return JSON.parse(response);
    } catch (error) {
      // 계산된 결과를 호출부로 반환합니다.
      return createErrorResponse(
        request,
        "Invalid bridge response JSON",
        "INVALID_JSON"
      );
    }
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!response) {
    // 계산된 결과를 호출부로 반환합니다.
    return createErrorResponse(
      request,
      "Empty bridge response",
      "EMPTY_RESPONSE"
    );
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof response.isSuccess === "boolean") {
    // 계산된 결과를 호출부로 반환합니다.
    return response;
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (response.error) {
    // 계산된 결과를 호출부로 반환합니다.
    return createErrorResponse(
      {
        requestId: response.requestId || request?.requestId,
        requestDate: response.requestDate || request?.requestDate,
      },
      response.error,
      "BRIDGE_ERROR"
    );
  }

  // 계산된 결과를 호출부로 반환합니다.
  return createSuccessResponse(
    {
      requestId: response.requestId || request?.requestId,
      requestDate: response.requestDate || request?.requestDate,
    },
    response.data ?? response
  );
}

/**
 * @description Native에서 전달된 bridge 응답을 callback registry에 위임합니다.
 * @param {*} rawResponse - Native 원본 응답입니다.
 * @returns {void}
 */
function completeBridgeResponse(rawResponse) {
  completeRegisteredBridgeResponse(rawResponse);
}

/**
 * @description throwIfErrorResponse 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @param {*} response - response 입력값입니다.
 * @param {*} contractMap - contractMap 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function throwIfErrorResponse(type, response, contractMap) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (response.isSuccess) return;

  const errorResponse = validateBridgeErrorResponse(
    type,
    response,
    contractMap,
    response
  );
  const error = new Error(
    errorResponse.message ||
      errorResponse.error?.detail ||
      "Bridge response error"
  );
  error.response = errorResponse;
  error.status = errorResponse.meta?.status || response.meta?.status || 500;
  throw error;
}

/**
 * @description getApiBaseUrl 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getApiBaseUrl() {
  const configured = process.env.VUE_APP_API_BASE_URL || "/api";
  // 계산된 결과를 호출부로 반환합니다.
  return configured.replace(/\/$/, "");
}

/**
 * @description interpolatePath 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} path - path 입력값입니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function interpolatePath(path, payload) {
  // 계산된 결과를 호출부로 반환합니다.
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, key) =>
    encodeURIComponent(payload?.[key] ?? "")
  );
}

/**
 * @description buildBackendUrl 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} contract - contract 입력값입니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function buildBackendUrl(contract, payload) {
  const rawPath =
    contract.httpPath || `/${contract.type?.toLowerCase?.() || ""}`;
  const path = interpolatePath(rawPath, payload);
  // 계산된 결과를 호출부로 반환합니다.
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * @description pickRequestBody 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} method - method 입력값입니다.
 * @param {*} request - request 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function pickRequestBody(method, request) {
  const normalizedMethod = method.toUpperCase();

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (normalizedMethod === "GET" || normalizedMethod === "HEAD") {
    // 계산된 결과를 호출부로 반환합니다.
    return undefined;
  }

  // 계산된 결과를 호출부로 반환합니다.
  return JSON.stringify(request);
}

/**
 * @description parseBackendBody 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} response - response 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
async function parseBackendBody(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!text) return null;

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (contentType.includes("application/json")) {
    // 계산된 결과를 호출부로 반환합니다.
    return JSON.parse(text);
  }

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    // 계산된 결과를 호출부로 반환합니다.
    return JSON.parse(text);
  } catch (error) {
    // 계산된 결과를 호출부로 반환합니다.
    return text;
  }
}

/**
 * @description normalizeBackendSuccess 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} request - request 입력값입니다.
 * @param {*} backendBody - backendBody 입력값입니다.
 * @param {*} contract - contract 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function normalizeBackendSuccess(request, backendBody, contract) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (
    backendBody &&
    typeof backendBody === "object" &&
    typeof backendBody.isSuccess === "boolean"
  ) {
    // 계산된 결과를 호출부로 반환합니다.
    return backendBody;
  }

  // 계산된 결과를 호출부로 반환합니다.
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

/**
 * @description normalizeBackendError 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} request - request 입력값입니다.
 * @param {*} response - response 입력값입니다.
 * @param {*} backendBody - backendBody 입력값입니다.
 * @param {*} contract - contract 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function normalizeBackendError(request, response, backendBody, contract) {
  const status = response?.status || 500;
  const statusText = response?.statusText || "Backend Error";
  const backendMessage =
    backendBody?.message || backendBody?.error || backendBody?.detail;
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

  // 계산된 결과를 호출부로 반환합니다.
  return error;
}

/**
 * @description requestBackend 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @param {*} request - request 입력값입니다.
 * @param {*} contract - contract 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
async function requestBackend(type, request, contract) {
  const method = (contract.httpMethod || "POST").toUpperCase();
  const url = buildBackendUrl(contract, request);
  const response = await window.fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: pickRequestBody(method, request),
  });
  const backendBody = await parseBackendBody(response);

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!response.ok) {
    // 계산된 결과를 호출부로 반환합니다.
    return normalizeBackendError(request, response, backendBody, contract);
  }

  // 계산된 결과를 호출부로 반환합니다.
  return normalizeBackendSuccess(request, backendBody, contract);
}

/**
 * @description executeWebApi 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function executeWebApi(type, payload = {}) {
  const contract = getContract(type, WebApiContract);
  const request = createBridgeRequest(payload);

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    const response = await requestBackend(type, request, contract);

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!response.isSuccess) {
      throwIfErrorResponse(type, response, WebApiContract);
    }

    // 계산된 결과를 호출부로 반환합니다.
    return response;
  } catch (error) {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (error?.response) throw error;

    const errorResponse = createErrorResponse(
      request,
      error,
      "BACKEND_CALL_ERROR"
    );
    errorResponse.meta = {
      category: BRIDGE_CATEGORY.WEB_API,
      runtime: "backend",
      endpoint: contract.httpPath,
      method: contract.httpMethod,
      status: 500,
    };

    throwIfErrorResponse(type, errorResponse, WebApiContract);
    // 계산된 결과를 호출부로 반환합니다.
    return errorResponse;
  }
}

/**
 * @description callNative 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @param {*} payload - payload 입력값입니다.
 * @param {*} timeout - timeout 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function callNative(type, payload, timeout = BRIDGE_TIMEOUT) {
  // 계산된 결과를 호출부로 반환합니다.
  return new Promise((resolve, reject) => {
    let validPayload;

    // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
    try {
      validPayload = validateBridgeRequest(type, payload, JsToAndroidContract);
    } catch (error) {
      reject(error);
      return;
    }

    const {requestId} = validPayload;
    const canUsePostMessage = hasPostMessageBridge();
    const canUseDirectMethod = hasDirectAndroidBridge(type);

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (settled) return;

      settled = true;
      removeBridgeCallback(requestId);

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
      const error = new Error(errorResponse.message);
      error.response = errorResponse;
      error.status = 504;
      reject(error);
    }, timeout);

    registerBridgeCallback(requestId, (rawResponse) => {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (settled) return;

      settled = true;
      window.clearTimeout(timer);
      removeBridgeCallback(requestId);

      // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
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

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (canUsePostMessage) {
      // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
      try {
        const rawResponse = getAndroidBridge().postMessage(
          JSON.stringify({
            requestId,
            type,
            payload: validPayload,
          })
        );
        // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
        if (rawResponse) {
          completeBridgeResponse(
            normalizeBridgeResponse(rawResponse, validPayload)
          );
        }
      } catch (error) {
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
        completeBridgeResponse(errorResponse);
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
        completeBridgeResponse(errorResponse);
      });
  });
}

/**
 * @description rejectAndroidToJsSwaggerExecution 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function rejectAndroidToJsSwaggerExecution(type, payload = {}) {
  let request;

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    request = validateBridgeRequest(type, payload, AndroidToJsContract);
  } catch (error) {
    // 계산된 결과를 호출부로 반환합니다.
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
  // 계산된 결과를 호출부로 반환합니다.
  return Promise.reject(error);
}

/**
 * @description receiveNativeEvent 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function receiveNativeEvent(type, payload = {}) {
  const request = validateBridgeRequest(
    type,
    parseNativePayload(payload),
    AndroidToJsContract
  );

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    const activePinia = getActivePinia();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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

  // 계산된 결과를 호출부로 반환합니다.
  return validateBridgeResponse(type, response, AndroidToJsContract, request);
}

/**
 * @description createNativeEventHandler 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createNativeEventHandler(type) {
  // 계산된 결과를 호출부로 반환합니다.
  return (payload = {}) => {
    // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
    try {
      const response = receiveNativeEvent(type, payload);
      // 계산된 결과를 호출부로 반환합니다.
      return JSON.stringify(response);
    } catch (error) {
      // 계산된 결과를 호출부로 반환합니다.
      return JSON.stringify(
        error?.response ||
          createErrorResponse(
            createBridgeRequest(parseNativePayload(payload)),
            error,
            "ANDROID_TO_JS_ERROR"
          )
      );
    }
  };
}

/**
 * @description executeContract 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} category - category 입력값입니다.
 * @param {*} type - type 입력값입니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function executeContract(category, type, payload = {}) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (category === "web-api") return executeWebApi(type, payload);
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (category === "js-to-android") return callNative(type, payload);
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (category === "android-to-js")
    // 계산된 결과를 호출부로 반환합니다.
    return rejectAndroidToJsSwaggerExecution(type, payload);
  // 계산된 결과를 호출부로 반환합니다.
  return executeWebApi(type, payload);
}

window.__bridgeResponse = completeBridgeResponse;
window.__receiveNativeEvent = (type, payload = {}) => {
  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    // 계산된 결과를 호출부로 반환합니다.
    return JSON.stringify(receiveNativeEvent(type, payload));
  } catch (error) {
    // 계산된 결과를 호출부로 반환합니다.
    return JSON.stringify(
      error?.response ||
        createErrorResponse(
          createBridgeRequest(parseNativePayload(payload)),
          error,
          "ANDROID_TO_JS_ERROR"
        )
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
