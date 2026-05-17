const callbacks = new Map();

export function registerBridgeCallback(requestId, callback) {
  callbacks.set(requestId, callback);
  return () => callbacks.delete(requestId);
}

export function unregisterBridgeCallback(requestId) {
  callbacks.delete(requestId);
}

export function completeBridgeCallback(rawResponse) {
  const requestId = extractRequestId(rawResponse);
  if (!requestId) return false;
  const callback = callbacks.get(requestId);
  if (!callback) return false;
  callback(rawResponse);
  return true;
}

export function extractRequestId(rawResponse) {
  if (typeof rawResponse !== 'string') return rawResponse?.requestId;
  try {
    return JSON.parse(rawResponse)?.requestId;
  } catch (error) {
    return null;
  }
}
