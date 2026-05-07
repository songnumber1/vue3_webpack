import {
  AndroidToJsContract,
  BridgeContract,
  JsToAndroidContract,
  WebApiContract,
} from "./contract";
import {BRIDGE_CATEGORY, BRIDGE_TIMEOUT} from "./bridgeConstants";

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

function parseBySchema(schema, value, errorPrefix) {
  const parsed = schema.safeParse(value || {});

  if (!parsed.success) {
    const message = parsed.error?.errors
      ?.map((error) => `${error.path.join(".") || "root"}: ${error.message}`)
      .join(", ");

    throw new Error(`${errorPrefix}${message ? ` - ${message}` : ""}`);
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

function validateRequest(type, payload, contractMap = BridgeContract) {
  const contract = getContract(type, contractMap);
  return parseBySchema(contract.request, createBridgeRequest(payload), `Invalid request payload: ${type}`);
}

function validateResponse(type, data, contractMap = BridgeContract) {
  const contract = getContract(type, contractMap);
  return parseBySchema(contract.response, data, `Invalid response payload: ${type}`);
}

function validateErrorResponse(type, data, contractMap = BridgeContract) {
  const contract = getContract(type, contractMap);
  return parseBySchema(contract.error, data, `Invalid error response payload: ${type}`);
}

async function runWebNativeRuntime(type, payload) {
  switch (type) {
    case "GET_APP_VERSION":
      return {
        platform: "web-runtime",
        appVersion: "web-dev-runtime",
        buildNumber: "browser",
      };

    case "GET_PUSH_TOKEN":
      return {
        token: window.localStorage?.getItem("web_runtime_push_token") || `web-token-${payload.requestId}`,
      };

    case "COPY_CLIPBOARD":
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(payload.text);
        } catch (error) {
          window.localStorage?.setItem("web_runtime_clipboard", payload.text);
        }
      } else {
        window.localStorage?.setItem("web_runtime_clipboard", payload.text);
      }
      return {
        copied: Boolean(payload.text),
      };

    default:
      return {};
  }
}

function getAndroidBridgeMethodName(type) {
  const methodMap = {
    GET_APP_VERSION: "getAppVersion",
    GET_PUSH_TOKEN: "getPushToken",
    COPY_CLIPBOARD: "copyClipboard",
  };

  return methodMap[type];
}

function callDirectAndroidBridge(type, payload) {
  const methodName = getAndroidBridgeMethodName(type);
  const bridge = window.AndroidBridge;

  if (!bridge || !methodName || typeof bridge[methodName] !== "function") {
    return null;
  }

  const raw = bridge[methodName](JSON.stringify(payload));
  return Promise.resolve(raw);
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

  const errorResponse = validateErrorResponse(type, response, contractMap);
  const error = new Error(errorResponse.message || errorResponse.error?.detail || "Bridge response error");
  error.response = errorResponse;
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
  const request = validateRequest(type, payload, WebApiContract);

  try {
    const response = await requestBackend(type, request, contract);
    throwIfErrorResponse(type, response, WebApiContract);
    return validateResponse(type, response, WebApiContract);
  } catch (error) {
    if (error?.response) throw error;

    const errorResponse = createErrorResponse(request, error, "BACKEND_CALL_ERROR");
    errorResponse.meta = {
      category: BRIDGE_CATEGORY.WEB_API,
      runtime: "backend",
      endpoint: contract.httpPath,
      method: contract.httpMethod,
    };

    throwIfErrorResponse(type, errorResponse, WebApiContract);
    return errorResponse;
  }
}

export function callNative(type, payload, timeout = BRIDGE_TIMEOUT) {
  return new Promise((resolve, reject) => {
    let validPayload;

    try {
      validPayload = validateRequest(type, payload, JsToAndroidContract);
    } catch (error) {
      reject(error);
      return;
    }

    const {requestId} = validPayload;
    let settled = false;

    const timer = window.setTimeout(() => {
      if (settled) return;

      settled = true;
      delete callbacks[requestId];
      reject(new Error("Bridge timeout"));
    }, timeout);

    callbacks[requestId] = (rawResponse) => {
      if (settled) return;

      settled = true;
      window.clearTimeout(timer);
      delete callbacks[requestId];

      try {
        const response = normalizeBridgeResponse(rawResponse, validPayload);
        throwIfErrorResponse(type, response, JsToAndroidContract);
        resolve(validateResponse(type, response, JsToAndroidContract));
      } catch (error) {
        reject(error);
      }
    };

    if (window.AndroidBridge && typeof window.AndroidBridge.postMessage === "function") {
      window.AndroidBridge.postMessage(
        JSON.stringify({
          requestId,
          type,
          payload: validPayload,
        })
      );
      return;
    }

    const directBridgeResult = callDirectAndroidBridge(type, validPayload);

    if (directBridgeResult) {
      directBridgeResult
        .then((rawResponse) => {
          completeBridgeResponse(normalizeBridgeResponse(rawResponse, validPayload));
        })
        .catch((error) => {
          completeBridgeResponse(createErrorResponse(validPayload, error, "ANDROID_BRIDGE_ERROR"));
        });
      return;
    }

    runWebNativeRuntime(type, validPayload)
      .then((data) => {
        completeBridgeResponse(createSuccessResponse(
          validPayload,
          data,
          "Web Native Runtime으로 실제 실행되었습니다.",
          {category: "js-to-android", runtime: "web-native-runtime"}
        ));
      })
      .catch((error) => {
        completeBridgeResponse(createErrorResponse(validPayload, error, "WEB_NATIVE_RUNTIME_ERROR"));
      });
  });
}

export function receiveNativeEvent(type, payload = {}) {
  const request = validateRequest(type, payload, AndroidToJsContract);

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
    "Android → JS 이벤트를 수신했습니다.",
    {category: "android-to-js"}
  );

  return validateResponse(type, response, AndroidToJsContract);
}

export function executeContract(category, type, payload = {}) {
  if (category === "web-api") return executeWebApi(type, payload);
  if (category === "js-to-android") return callNative(type, payload);
  if (category === "android-to-js") return Promise.resolve(receiveNativeEvent(type, payload));
  return executeWebApi(type, payload);
}

window.__bridgeResponse = completeBridgeResponse;
window.__receiveNativeEvent = receiveNativeEvent;
