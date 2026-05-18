import {BridgeContract} from "./contract";
import {createContractError, createResponseError} from "./bridgeErrors";
import {createBridgeRequest} from "./bridgeUtils";

export function getContract(type, contractMap = BridgeContract) {
  const contract = contractMap[type];

  if (!contract) {
    throw new Error(`Unknown bridge type: ${type}`);
  }

  return contract;
}

function formatZodIssues(error) {
  return (
    error?.errors
      ?.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join(", ") || "Unknown schema validation error"
  );
}

function safeParseBySchema(schema, value, request, options) {
  const parsed = schema.safeParse(value || {});

  if (!parsed.success) {
    const detail = formatZodIssues(parsed.error);
    throw createContractError(
      request,
      `${options.message}: ${detail}`,
      options.code,
      options.status,
      options.meta
    );
  }

  return parsed.data;
}

export function validateBridgeRequest(type, payload, contractMap = BridgeContract) {
  const contract = getContract(type, contractMap);
  const request = createBridgeRequest(payload);

  return safeParseBySchema(contract.request, request, request, {
    code: "INVALID_BRIDGE_REQUEST",
    status: 400,
    message: `Invalid bridge request payload: ${type}`,
    meta: {type, phase: "request"},
  });
}

export function validateBridgeResponse(
  type,
  data,
  contractMap = BridgeContract,
  fallbackRequest = {}
) {
  const contract = getContract(type, contractMap);
  const request = {
    requestId: data?.requestId || fallbackRequest?.requestId,
    requestDate: data?.requestDate || fallbackRequest?.requestDate,
  };

  return safeParseBySchema(contract.response, data, request, {
    code: "INVALID_BRIDGE_RESPONSE",
    status: 500,
    message: `Invalid bridge response payload: ${type}`,
    meta: {type, phase: "response"},
  });
}

export function validateBridgeErrorResponse(
  type,
  data,
  contractMap = BridgeContract,
  fallbackRequest = {}
) {
  const contract = getContract(type, contractMap);
  const request = {
    requestId: data?.requestId || fallbackRequest?.requestId,
    requestDate: data?.requestDate || fallbackRequest?.requestDate,
  };

  return safeParseBySchema(contract.error, data, request, {
    code: "INVALID_BRIDGE_ERROR_RESPONSE",
    status: 500,
    message: `Invalid bridge error response payload: ${type}`,
    meta: {type, phase: "error-response"},
  });
}

export function throwIfErrorResponse(type, response, contractMap) {
  if (response.isSuccess) return;

  const errorResponse = validateBridgeErrorResponse(
    type,
    response,
    contractMap,
    response
  );
  throw createResponseError(
    errorResponse,
    errorResponse.meta?.status || response.meta?.status || 500
  );
}
