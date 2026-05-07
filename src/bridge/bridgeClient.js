import {
  AndroidToJsContract,
  BridgeContract,
  JsToAndroidContract,
  WebApiContract,
} from "./contract";
import {BRIDGE_TIMEOUT} from "./bridgeConstants";

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

function createWebApiMockData(type, payload) {
  switch (type) {
    case "GET_USER":
      return {
        id: payload.id,
        name: "Mock User",
      };

    case "LOGIN":
      return {
        token: "mock.jwt.token",
      };

    case "UPLOAD_FILE":
      return {
        url: `https://mock.local/files/${payload.fileName}`,
      };

    default:
      return {};
  }
}

function createNativeMockData(type, payload) {
  switch (type) {
    case "GET_APP_VERSION":
      return {
        platform: "web-mock",
        appVersion: "1.0.0-mock",
        buildNumber: "100",
      };

    case "GET_PUSH_TOKEN":
      return {
        token: "mock-push-token",
      };

    case "COPY_CLIPBOARD":
      return {
        copied: Boolean(payload.text),
      };

    default:
      return {};
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

  const errorResponse = validateErrorResponse(type, response, contractMap);
  const error = new Error(errorResponse.message || errorResponse.error?.detail || "Bridge response error");
  error.response = errorResponse;
  throw error;
}

export function executeWebApi(type, payload = {}) {
  const request = validateRequest(type, payload, WebApiContract);
  const response = createSuccessResponse(
    request,
    createWebApiMockData(type, request),
    "JS Web API mock 응답입니다.",
    {category: "web-api"}
  );

  return Promise.resolve(validateResponse(type, response, WebApiContract));
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

    window.setTimeout(() => {
      completeBridgeResponse(createSuccessResponse(
        validPayload,
        createNativeMockData(type, validPayload),
        "Android Bridge mock 응답입니다.",
        {category: "js-to-android", runtime: "mock"}
      ));
    }, 100);
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
