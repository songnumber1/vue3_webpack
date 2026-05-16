import {
  AndroidToJsContract,
  BridgeContract,
  JsToAndroidContract,
  WebApiContract,
} from "./contract";
import {BRIDGE_CATEGORY, BRIDGE_TIMEOUT} from "./bridgeConstants";
import {getActivePinia} from "pinia";
import {usePlatformStore} from "@/stores/platformStore";
import {logWarn} from "@/utils/logger";

const callbacks = {};

/**
 * createRequestId 처리 함수입니다.
 * @returns {void}
 */
function createRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * createIsoDate 처리 함수입니다.
 * @returns {void}
 */
function createIsoDate() {
  return new Date().toISOString();
}

/**
 * getContract 처리 함수입니다.
 * @param {*} type 함수 실행에 필요한 입력값입니다.
 * @param {*} contractMap 함수 실행에 필요한 입력값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getContract(type, contractMap = BridgeContract) {
  const contract = contractMap[type];

  if (!contract) {
    throw new Error(`Unknown bridge type: ${type}`);
  }

  return contract;
}

/**
 * formatZodIssues 처리 함수입니다.
 * @param {*} error 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function formatZodIssues(error) {
  return (
    error?.errors
      ?.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join(", ") || "Unknown schema validation error"
  );
}

/**
 * createContractError 처리 함수입니다.
 * @param {*} request 함수 실행에 필요한 입력값입니다.
 * @param {*} message 함수 실행에 필요한 입력값입니다.
 * @param {*} code 함수 실행에 필요한 입력값입니다.
 * @param {*} status 함수 실행에 필요한 입력값입니다.
 * @param {*} meta 함수 실행에 필요한 입력값입니다.
 * @returns {void}
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
  return error;
}

/**
 * safeParseBySchema 처리 함수입니다.
 * @param {*} schema 함수 실행에 필요한 입력값입니다.
 * @param {*} value 함수 실행에 필요한 입력값입니다.
 * @param {*} request 함수 실행에 필요한 입력값입니다.
 * @param {*} options 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
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

/**
 * createBridgeRequest 처리 함수입니다.
 * @param {*} payload 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function createBridgeRequest(payload = {}) {
  return {
    requestId: payload.requestId || createRequestId(),
    requestDate: payload.requestDate || createIsoDate(),
    ...payload,
  };
}

/**
 * validateBridgeRequest 처리 함수입니다.
 * @param {*} type 함수 실행에 필요한 입력값입니다.
 * @param {*} payload 함수 실행에 필요한 입력값입니다.
 * @param {*} contractMap 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
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

/**
 * 브릿지 응답 데이터가 계약 스키마와 일치하는지 검증합니다.
 * @param {string} type 브릿지 계약 타입입니다.
 * @param {*} data 검증할 응답 데이터입니다.
 * @param {*} contractMap 브릿지 계약 맵입니다.
 * @param {*} fallbackRequest 응답에 요청 식별자가 없을 때 사용할 요청 정보입니다.
 * @returns {*} 검증된 브릿지 응답을 반환합니다.
 */
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

  return safeParseBySchema(contract.response, data, request, {
    code: "INVALID_BRIDGE_RESPONSE",
    status: 500,
    message: `Invalid bridge response payload: ${type}`,
    meta: {type, phase: "response"},
  });
}

/**
 * 브릿지 오류 응답 데이터가 계약 스키마와 일치하는지 검증합니다.
 * @param {string} type 브릿지 계약 타입입니다.
 * @param {*} data 검증할 오류 응답 데이터입니다.
 * @param {*} contractMap 브릿지 계약 맵입니다.
 * @param {*} fallbackRequest 응답에 요청 식별자가 없을 때 사용할 요청 정보입니다.
 * @returns {*} 검증된 브릿지 오류 응답을 반환합니다.
 */
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

  return safeParseBySchema(contract.error, data, request, {
    code: "INVALID_BRIDGE_ERROR_RESPONSE",
    status: 500,
    message: `Invalid bridge error response payload: ${type}`,
    meta: {type, phase: "error-response"},
  });
}

/**
 * getAndroidBridgeMethodName 처리 함수입니다.
 * @param {*} type 함수 실행에 필요한 입력값입니다.
 * @returns {*} 처리 결과를 반환합니다.
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

  return methodMap[type];
}

/**
 * getAndroidBridge 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getAndroidBridge() {
  return window.AndroidBridge || null;
}

/**
 * hasPostMessageBridge 처리 함수입니다.
 * @returns {boolean|*} 처리 결과를 반환합니다.
 */
function hasPostMessageBridge() {
  return typeof getAndroidBridge()?.postMessage === "function";
}

/**
 * hasDirectAndroidBridge 처리 함수입니다.
 * @param {*} type 함수 실행에 필요한 입력값입니다.
 * @returns {boolean|*} 처리 결과를 반환합니다.
 */
function hasDirectAndroidBridge(type) {
  const methodName = getAndroidBridgeMethodName(type);
  const bridge = getAndroidBridge();

  return Boolean(
    bridge && methodName && typeof bridge[methodName] === "function"
  );
}

/**
 * callDirectAndroidBridge 처리 함수입니다.
 * @param {*} type 함수 실행에 필요한 입력값입니다.
 * @param {*} payload 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function callDirectAndroidBridge(type, payload) {
  const methodName = getAndroidBridgeMethodName(type);
  const bridge = getAndroidBridge();

  if (!bridge || !methodName || typeof bridge[methodName] !== "function") {
    return null;
  }

  const raw = bridge[methodName](JSON.stringify(payload));
  return Promise.resolve(raw);
}

/**
 * createBridgeUnavailableResponse 처리 함수입니다.
 * @param {*} request 함수 실행에 필요한 입력값입니다.
 * @param {*} type 함수 실행에 필요한 입력값입니다.
 * @returns {void}
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
  return response;
}

/**
 * parseNativePayload 처리 함수입니다.
 * @param {*} payload 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function parseNativePayload(payload) {
  if (typeof payload !== "string") return payload || {};

  try {
    return payload ? JSON.parse(payload) : {};
  } catch (error) {
    return {rawPayload: payload};
  }
}

/**
 * 네이티브 미연결 또는 Swagger 테스트 환경에서 사용할 성공 응답 객체를 생성합니다.
 * @param {*} request 원본 브릿지 요청 정보입니다.
 * @param {*} data 응답 데이터입니다.
 * @param {string} message 응답 메시지입니다.
 * @param {*} meta 부가 메타 데이터입니다.
 * @returns {*} 표준 성공 응답 객체를 반환합니다.
 */
function createSuccessResponse(
  request,
  data,
  message = "정상 처리되었습니다.",
  meta = {}
) {
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
 * createErrorResponse 처리 함수입니다.
 * @param {*} request 함수 실행에 필요한 입력값입니다.
 * @param {*} error 함수 실행에 필요한 입력값입니다.
 * @param {*} code 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function createErrorResponse(request, error, code = "BRIDGE_ERROR") {
  const message =
    error instanceof Error
      ? error.message
      : String(error || "Bridge response error");

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
 * normalizeBridgeResponse 처리 함수입니다.
 * @param {*} response 함수 실행에 필요한 입력값입니다.
 * @param {*} request 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function normalizeBridgeResponse(response, request) {
  if (typeof response === "string") {
    try {
      return JSON.parse(response);
    } catch (error) {
      return createErrorResponse(
        request,
        "Invalid bridge response JSON",
        "INVALID_JSON"
      );
    }
  }

  if (!response) {
    return createErrorResponse(
      request,
      "Empty bridge response",
      "EMPTY_RESPONSE"
    );
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

/**
 * completeBridgeResponse 처리 함수입니다.
 * @param {*} rawResponse 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function completeBridgeResponse(rawResponse) {
  const requestId =
    typeof rawResponse === "string"
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

/**
 * throwIfErrorResponse 처리 함수입니다.
 * @param {*} type 함수 실행에 필요한 입력값입니다.
 * @param {*} response 함수 실행에 필요한 입력값입니다.
 * @param {*} contractMap 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function throwIfErrorResponse(type, response, contractMap) {
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
 * getApiBaseUrl 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getApiBaseUrl() {
  const configured = process.env.VUE_APP_API_BASE_URL || "/api";
  return configured.replace(/\/$/, "");
}

/**
 * interpolatePath 처리 함수입니다.
 * @param {*} path 함수 실행에 필요한 입력값입니다.
 * @param {*} payload 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function interpolatePath(path, payload) {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, key) =>
    encodeURIComponent(payload?.[key] ?? "")
  );
}

/**
 * buildBackendUrl 처리 함수입니다.
 * @param {*} contract 함수 실행에 필요한 입력값입니다.
 * @param {*} payload 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function buildBackendUrl(contract, payload) {
  const rawPath =
    contract.httpPath || `/${contract.type?.toLowerCase?.() || ""}`;
  const path = interpolatePath(rawPath, payload);
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * pickRequestBody 처리 함수입니다.
 * @param {*} method 함수 실행에 필요한 입력값입니다.
 * @param {*} request 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function pickRequestBody(method, request) {
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod === "GET" || normalizedMethod === "HEAD") {
    return undefined;
  }

  return JSON.stringify(request);
}

/**
 * parseBackendBody 처리 함수입니다.
 * @param {*} response 함수 실행에 필요한 입력값입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
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

/**
 * normalizeBackendSuccess 처리 함수입니다.
 * @param {*} request 함수 실행에 필요한 입력값입니다.
 * @param {*} backendBody 함수 실행에 필요한 입력값입니다.
 * @param {*} contract 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function normalizeBackendSuccess(request, backendBody, contract) {
  if (
    backendBody &&
    typeof backendBody === "object" &&
    typeof backendBody.isSuccess === "boolean"
  ) {
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

/**
 * normalizeBackendError 처리 함수입니다.
 * @param {*} request 함수 실행에 필요한 입력값입니다.
 * @param {*} response 함수 실행에 필요한 입력값입니다.
 * @param {*} backendBody 함수 실행에 필요한 입력값입니다.
 * @param {*} contract 함수 실행에 필요한 입력값입니다.
 * @returns {void}
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

  return error;
}

/**
 * requestBackend 처리 함수입니다.
 * @param {*} type 함수 실행에 필요한 입력값입니다.
 * @param {*} request 함수 실행에 필요한 입력값입니다.
 * @param {*} contract 함수 실행에 필요한 입력값입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
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

  if (!response.ok) {
    return normalizeBackendError(request, response, backendBody, contract);
  }

  return normalizeBackendSuccess(request, backendBody, contract);
}

/**
 * executeWebApi 함수입니다.
 * @param {*} type 함수 실행에 필요한 값입니다.
 * @param {*} payload 함수 실행에 필요한 값입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
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
    return errorResponse;
  }
}

/**
 * callNative 함수입니다.
 * @param {*} type 함수 실행에 필요한 값입니다.
 * @param {*} payload 함수 실행에 필요한 값입니다.
 * @param {*} timeout 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
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

    callbacks[requestId] = (rawResponse) => {
      if (settled) return;

      settled = true;
      window.clearTimeout(timer);
      delete callbacks[requestId];

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
    };

    if (canUsePostMessage) {
      try {
        const rawResponse = getAndroidBridge().postMessage(
          JSON.stringify({
            requestId,
            type,
            payload: validPayload,
          })
        );
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
 * rejectAndroidToJsSwaggerExecution 함수입니다.
 * @param {*} type 함수 실행에 필요한 값입니다.
 * @param {*} payload 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
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

/**
 * receiveNativeEvent 함수입니다.
 * @param {*} type 함수 실행에 필요한 값입니다.
 * @param {*} payload 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function receiveNativeEvent(type, payload = {}) {
  const request = validateBridgeRequest(
    type,
    parseNativePayload(payload),
    AndroidToJsContract
  );

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

/**
 * createNativeEventHandler 처리 함수입니다.
 * @param {*} type 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function createNativeEventHandler(type) {
  return (payload = {}) => {
    try {
      const response = receiveNativeEvent(type, payload);
      return JSON.stringify(response);
    } catch (error) {
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
 * executeContract 함수입니다.
 * @param {*} category 함수 실행에 필요한 값입니다.
 * @param {*} type 함수 실행에 필요한 값입니다.
 * @param {*} payload 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function executeContract(category, type, payload = {}) {
  if (category === "web-api") return executeWebApi(type, payload);
  if (category === "js-to-android") return callNative(type, payload);
  if (category === "android-to-js")
    return rejectAndroidToJsSwaggerExecution(type, payload);
  return executeWebApi(type, payload);
}

window.__bridgeResponse = completeBridgeResponse;
window.__receiveNativeEvent = (type, payload = {}) => {
  try {
    return JSON.stringify(receiveNativeEvent(type, payload));
  } catch (error) {
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
