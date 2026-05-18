const callbacks = {};

function extractRequestId(rawResponse) {
  if (typeof rawResponse !== "string") return rawResponse?.requestId;

  try {
    return JSON.parse(rawResponse)?.requestId;
  } catch (error) {
    return null;
  }
}

export function setBridgeCallback(requestId, callback) {
  callbacks[requestId] = callback;
}

export function deleteBridgeCallback(requestId) {
  delete callbacks[requestId];
}

export function getBridgeCallback(requestId) {
  return callbacks[requestId];
}

export function completeBridgeResponse(rawResponse) {
  const requestId = extractRequestId(rawResponse);

  if (!requestId) return;

  const callback = getBridgeCallback(requestId);

  if (!callback) return;

  callback(rawResponse);
}
