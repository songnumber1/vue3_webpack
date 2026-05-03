// src/bridge/callNative.js
export function callNative(type, payload) {
  return new Promise((resolve) => {
    const requestId = Date.now().toString();

    window.__bridgeCallbacks = window.__bridgeCallbacks || {};

    window.__bridgeCallbacks[requestId] = (res) => {
      resolve(res);
    };

    window.AndroidBridge.postMessage(
      JSON.stringify({
        requestId,
        type,
        payload,
      })
    );
  });
}
