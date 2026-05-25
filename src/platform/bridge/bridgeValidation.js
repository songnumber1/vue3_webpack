/**
 * @file platform/bridge/bridgeValidation.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

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

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function formatZodIssues(error) {
  return (
    error?.errors
      ?.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join(", ") || "Unknown schema validation error"
  );
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
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

export function validateBridgeRequest(
  type,
  payload,
  contractMap = BridgeContract
) {
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
