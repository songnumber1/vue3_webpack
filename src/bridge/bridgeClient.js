import {bridgeStore} from "./bridgeStore";

const callbacks = {};

export function callNative(type, payload, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}_${Math.random()}`;

    bridgeStore.addEvent({
      id: requestId,
      type,
      payload,
      status: "REQUEST",
    });

    const timer = setTimeout(() => {
      delete callbacks[requestId];

      bridgeStore.addEvent({
        id: requestId,
        type,
        error: "timeout",
        status: "ERROR",
      });

      reject(new Error("Bridge timeout"));
    }, timeout);

    callbacks[requestId] = (res) => {
      clearTimeout(timer);
      delete callbacks[requestId];

      bridgeStore.addEvent({
        id: requestId,
        type,
        response: res,
        status: "RESPONSE",
      });

      resolve(res);
    };

    if (window.AndroidBridge) {
      window.AndroidBridge.postMessage(
        JSON.stringify({
          requestId,
          type,
          payload,
        })
      );
    } else {
      setTimeout(() => {
        window.__bridgeResponse({
          requestId,
          data: {mock: true, type, payload},
          error: null,
        });
      }, 100);
    }
  });
}

window.__bridgeResponse = function (response) {
  const {requestId, data, error} = response;

  if (callbacks[requestId]) {
    callbacks[requestId]({
      success: !error,
      data,
      error,
    });
  }
};
