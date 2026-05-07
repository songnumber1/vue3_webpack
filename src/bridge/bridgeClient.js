import {BridgeContract} from "./contract";
import {BRIDGE_TIMEOUT} from "./bridgeConstants";

const callbacks = {};

function createRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function createIsoDate() {
  return new Date().toISOString();
}

function getContract(type) {
  const contract = BridgeContract[type];

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

function validateRequest(type, payload) {
  const contract = getContract(type);
  return parseBySchema(contract.request, createBridgeRequest(payload), `Invalid request payload: ${type}`);
}

function validateResponse(type, data) {
  const contract = getContract(type);
  return parseBySchema(contract.response, data, `Invalid response payload: ${type}`);
}

function validateErrorResponse(type, data) {
  const contract = getContract(type);
  return parseBySchema(contract.error, data, `Invalid error response payload: ${type}`);
}

function createMockData(type, payload) {
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

function createSuccessResponse(request, data, message = "정상 처리되었습니다.") {
  return {
    requestId: request.requestId,
    requestDate: request.requestDate,
    responseDate: createIsoDate(),
    isSuccess: true,
    code: "SUCCESS",
    data,
    message,
    meta: {},
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

  // 신규 표준 응답 포맷: BaseResponse / BaseResponseError
  if (typeof response.isSuccess === "boolean") {
    return response;
  }

  // 기존 Android 응답 포맷 호환: { requestId, data, error }
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

export function callNative(type, payload, timeout = BRIDGE_TIMEOUT) {
  return new Promise((resolve, reject) => {
    let validPayload;

    try {
      validPayload = validateRequest(type, payload);
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

        if (!response.isSuccess) {
          const errorResponse = validateErrorResponse(type, response);
          const error = new Error(errorResponse.message || errorResponse.error?.detail || "Bridge response error");
          error.response = errorResponse;
          throw error;
        }

        resolve(validateResponse(type, response));
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

    // 웹 브라우저 단독 테스트용 mock. Android 연결 시에는 위 AndroidBridge 분기를 사용한다.
    window.setTimeout(() => {
      completeBridgeResponse(createSuccessResponse(validPayload, createMockData(type, validPayload)));
    }, 100);
  });
}

window.__bridgeResponse = completeBridgeResponse;
