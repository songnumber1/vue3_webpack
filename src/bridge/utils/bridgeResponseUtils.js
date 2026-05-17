import {createBridgeRequest, createIsoDate, createRequestId} from './bridgeRequestUtils';

export function createSuccessResponse(request, data, message = '정상 처리되었습니다.', meta = {}) {
  return {
    requestId: request.requestId,
    requestDate: request.requestDate,
    responseDate: createIsoDate(),
    isSuccess: true,
    code: 'SUCCESS',
    data,
    message,
    meta,
  };
}

export function createErrorResponse(request, error, code = 'BRIDGE_ERROR') {
  const message = error instanceof Error ? error.message : String(error || 'Bridge response error');
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

export function normalizeBridgeResponse(response, request) {
  if (typeof response === 'string') {
    try {
      return JSON.parse(response);
    } catch (error) {
      return createErrorResponse(request, 'Invalid bridge response JSON', 'INVALID_JSON');
    }
  }

  if (!response) return createErrorResponse(request, 'Empty bridge response', 'EMPTY_RESPONSE');
  if (typeof response.isSuccess === 'boolean') return response;

  if (response.error) {
    return createErrorResponse(
      {
        requestId: response.requestId || request?.requestId,
        requestDate: response.requestDate || request?.requestDate,
      },
      response.error,
      'BRIDGE_ERROR'
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

export function createNativeHandlerErrorResponse(payload, error) {
  return error?.response || createErrorResponse(createBridgeRequest(payload), error, 'ANDROID_TO_JS_ERROR');
}
