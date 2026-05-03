import {BridgeContract} from "./contract";
import {bridgeStore} from "./bridgeStore";
import {BRIDGE_STATUS, BRIDGE_TIMEOUT} from "./bridgeConstants";

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

function validateRequest(type, payload) {
  const contract = getContract(type);
  const parsed = contract.request.safeParse(payload || {});

  if (!parsed.success) {
    throw new Error(`Invalid request payload: ${type}`);
  }

  return parsed.data;
}

function validateResponse(type, data) {
  const contract = getContract(type);
  const parsed = contract.response.safeParse(data || {});

  if (!parsed.success) {
    throw new Error(`Invalid response payload: ${type}`);
  }

  return parsed.data;
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

function addEvent(event) {
  bridgeStore.addEvent(event);
}

function addErrorEvent(requestId, type, error, payload) {
  addEvent({
    id: requestId,
    type,
    payload,
    error: error instanceof Error ? error.message : String(error),
    status: BRIDGE_STATUS.ERROR,
  });
}

export function callNative(type, payload, timeout = BRIDGE_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const requestId = createRequestId();
    let validPayload;

    try {
      validPayload = validateRequest(type, payload);
    } catch (error) {
      addErrorEvent(requestId, type, error, payload);
      reject(error);
      return;
    }

    addEvent({
      id: requestId,
      type,
      payload: validPayload,
      status: BRIDGE_STATUS.REQUEST,
    });

    let settled = false;

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      delete callbacks[requestId];
      callback();
    };

    const timer = setTimeout(() => {
      finish(() => {
        const error = new Error("Bridge timeout");
        addErrorEvent(requestId, type, error, validPayload);
        reject(error);
      });
    }, timeout);

    callbacks[requestId] = (response) => {
      finish(() => {
        try {
          if (!response.success) {
            throw new Error(response.error || "Bridge response error");
          }

          const data = validateResponse(type, response.data);
          const normalizedResponse = {
            success: true,
            data,
            error: null,
          };

          addEvent({
            id: requestId,
            type,
            response: normalizedResponse,
            status: BRIDGE_STATUS.RESPONSE,
          });

          resolve(normalizedResponse);
        } catch (error) {
          const normalizedError = {
            success: false,
            data: null,
            error: error.message,
          };

          addEvent({
            id: requestId,
            type,
            response: normalizedError,
            error: error.message,
            status: BRIDGE_STATUS.ERROR,
          });

          reject(error);
        }
      });
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

    // AndroidBridge가 없는 웹 개발 환경에서도 Swagger Execute가 반드시 종료되도록 mock 응답을 동일 흐름으로 전달한다.
    setTimeout(() => {
      window.__bridgeResponse({
        requestId,
        data: createMockData(type, validPayload),
        error: null,
      });
    }, 100);
  });
}

window.__bridgeResponse = function (rawResponse) {
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
};
