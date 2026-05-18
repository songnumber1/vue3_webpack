import {createErrorResponse} from "./bridgeResponses";

export function createContractError(request, message, code, status = 400, meta = {}) {
  const errorResponse = createErrorResponse(request, message, code);
  errorResponse.meta = {
    ...errorResponse.meta,
    ...meta,
    status,
  };

  const error = new Error(message);
  error.response = errorResponse;
  error.status = status;
  return error;
}

export function createResponseError(errorResponse, fallbackStatus = 500) {
  const error = new Error(
    errorResponse.message ||
      errorResponse.error?.detail ||
      "Bridge response error"
  );
  error.response = errorResponse;
  error.status = errorResponse.meta?.status || fallbackStatus;
  return error;
}
