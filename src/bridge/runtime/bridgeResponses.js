import {BRIDGE_CATEGORY} from "../bridgeConstants";
import {
  createBridgeRequest,
  createIsoDate,
  createRequestId,
} from "../bridgeUtils";

export function createSuccessResponse(
  request,
  data,
  message = "정상 처리되었습니다.",
  meta = {}
) {
  return {
    requestId: request.requestId,
    requestDate: request.requestDate,
    responseDate: createIsoDate(),
    isSuccess: true,
    code: "SUCCESS",
    data,
    message,
    meta,
  };
}

export function createErrorResponse(request, error, code = "BRIDGE_ERROR") {
  const message =
    error instanceof Error
      ? error.message
      : String(error || "Bridge response error");

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
  if (typeof response === "string") {
    try {
      return JSON.parse(response);
    } catch (error) {
      return createErrorResponse(
        request,
        "Invalid bridge response JSON",
        "INVALID_JSON"
      );
    }
  }

  if (!response) {
    return createErrorResponse(
      request,
      "Empty bridge response",
      "EMPTY_RESPONSE"
    );
  }

  if (typeof response.isSuccess === "boolean") {
    return response;
  }

  if (response.error) {
    return createErrorResponse(
      {
        requestId: response.requestId || request?.requestId,
        requestDate: response.requestDate || request?.requestDate,
      },
      response.error,
      "BRIDGE_ERROR"
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

export function createBridgeUnavailableResponse(request, type) {
  const response = createErrorResponse(
    request,
    `AndroidBridge가 없어 ${type} 요청을 실제 Native로 전달할 수 없습니다. Windows/Web 브라우저에서는 성공 mock을 반환하지 않습니다.`,
    "ANDROID_BRIDGE_UNAVAILABLE"
  );
  response.meta = {
    ...response.meta,
    type,
    phase: "native-bridge",
    status: 503,
  };
  return response;
}

export function createNativeDispatchRequiredResponse(request, type) {
  const errorResponse = createErrorResponse(
    request,
    `${type}는 Android Native가 WebView의 JS 함수를 호출해야 하는 이벤트입니다. Swagger/Web 화면에서 성공 mock으로 실행하지 않습니다. Android에서 window.onAppResume/onBackPressed/onPushClick 또는 window.__receiveNativeEvent를 호출해 테스트해야 합니다.`,
    "ANDROID_TO_JS_REQUIRES_NATIVE_DISPATCH"
  );
  errorResponse.meta = {
    ...errorResponse.meta,
    type,
    phase: "native-dispatch",
    status: 501,
  };
  return errorResponse;
}

export function createBackendSuccessResponse(request, backendBody, contract) {
  return createSuccessResponse(
    request,
    backendBody,
    "Backend API를 실제 호출한 결과입니다.",
    {
      category: BRIDGE_CATEGORY.WEB_API,
      runtime: "backend",
      endpoint: contract.httpPath,
      method: contract.httpMethod,
    }
  );
}

export function createAndroidToJsFallbackError(payload, error) {
  return createErrorResponse(
    createBridgeRequest(payload),
    error,
    "ANDROID_TO_JS_ERROR"
  );
}
