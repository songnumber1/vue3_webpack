/**
 * @description Android Bridge requestId별 callback을 등록/해제하는 전용 registry입니다.
 */
const callbacks = {};

function getRequestId(rawResponse) {
  if (typeof rawResponse !== 'string') return rawResponse?.requestId;

  try {
    return JSON.parse(rawResponse)?.requestId;
  } catch (error) {
    return null;
  }
}

export function registerBridgeCallback(requestId, callback) {
  if (!requestId || typeof callback !== 'function') return;
  callbacks[requestId] = callback;
}

export function removeBridgeCallback(requestId) {
  if (!requestId) return;
  delete callbacks[requestId];
}

export function completeRegisteredBridgeResponse(rawResponse) {
  const requestId = getRequestId(rawResponse);
  if (!requestId) return;

  const callback = callbacks[requestId];
  if (!callback) return;

  callback(rawResponse);
}
