import {BridgeContract} from "./contract";
import {BRIDGE_TIMEOUT} from "./bridgeConstants";

const callbacks = {};

function createRequestId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
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

function validateRequest(type, payload) {
  const contract = getContract(type);
  return parseBySchema(contract.request, payload, `Invalid request payload: ${type}`);
}

function validateResponse(type, data) {
  const contract = getContract(type);
  return parseBySchema(contract.response, data, `Invalid response payload: ${type}`);
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

function normalizeBridgeResponse(response) {
  if (typeof response === "string") {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        requestId: null,
        data: null,
        error: "Invalid bridge response JSON",
      };
    }
  }

  return response || {};
}

function completeBridgeResponse(rawResponse) {
  const response = normalizeBridgeResponse(rawResponse);
  const {requestId, data, error} = response;

  if (!requestId) return;

  const callback = callbacks[requestId];

  if (!callback) return;

  callback({
    success: !error,
    data,
    error,
  });
}

export function callNative(type, payload, timeout = BRIDGE_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const requestId = createRequestId();
    let validPayload;

    try {
      validPayload = validateRequest(type, payload);
    } catch (error) {
      reject(error);
      return;
    }

    let settled = false;

    const timer = window.setTimeout(() => {
      if (settled) return;

      settled = true;
      delete callbacks[requestId];
      reject(new Error("Bridge timeout"));
    }, timeout);

    callbacks[requestId] = (response) => {
      if (settled) return;

      settled = true;
      window.clearTimeout(timer);
      delete callbacks[requestId];

      try {
        if (!response.success) {
          throw new Error(response.error || "Bridge response error");
        }

        const data = validateResponse(type, response.data);

        resolve({
          success: true,
          data,
          error: null,
        });
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
      completeBridgeResponse({
        requestId,
        data: createMockData(type, validPayload),
        error: null,
      });
    }, 100);
  });
}

window.__bridgeResponse = completeBridgeResponse;
