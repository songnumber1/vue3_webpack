export function createRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function createIsoDate() {
  return new Date().toISOString();
}

export function createBridgeRequest(payload = {}) {
  return {
    requestId: payload.requestId || createRequestId(),
    requestDate: payload.requestDate || createIsoDate(),
    ...payload,
  };
}

export function parseNativePayload(payload) {
  if (typeof payload !== 'string') return payload || {};
  try {
    return payload ? JSON.parse(payload) : {};
  } catch (error) {
    return {rawPayload: payload};
  }
}
