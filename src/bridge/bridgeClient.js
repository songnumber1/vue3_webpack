const callbacks = {};

export function callNative(type, payload, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}_${Math.random()}`;

    // 콜백 등록
    callbacks[requestId] = (res) => {
      clearTimeout(timer);
      delete callbacks[requestId];
      resolve(res); // 🔥 이게 핵심 (res 그대로)
    };

    const timer = setTimeout(() => {
      delete callbacks[requestId];
      reject(new Error("Bridge timeout"));
    }, timeout);

    if (window.AndroidBridge) {
      window.AndroidBridge.postMessage(
        JSON.stringify({
          requestId,
          type,
          payload,
        })
      );
    } else {
      // 🔥 개발용 mock 추가
      resolve({
        success: true,
        data: {mock: true, type, payload},
      });
    }
  });
}

// Android 응답
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
