import {DEFAULT_API_BASE_PATH} from "@/constants/apiMode";
/**
 * @file platform/bridge/web/bridgeWebApiRuntime.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {WebApiContract} from "../contract";
import {BRIDGE_CATEGORY} from "../bridgeConstants";
import {createBridgeRequest} from "../bridgeUtils";
import {
  createBackendSuccessResponse,
  createErrorResponse,
} from "../runtime/bridgeResponses";
import {getContract, throwIfErrorResponse} from "../bridgeValidation";

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getApiBaseUrl() {
  const configured = process.env.VUE_APP_API_BASE_URL || DEFAULT_API_BASE_PATH;
  return configured.replace(/\/$/, "");
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function interpolatePath(path, payload) {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, key) =>
    encodeURIComponent(payload?.[key] ?? "")
  );
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function buildBackendUrl(contract, payload) {
  const rawPath =
    contract.httpPath || `/${contract.type?.toLowerCase?.() || ""}`;
  const path = interpolatePath(rawPath, payload);
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function pickRequestBody(method, request) {
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod === "GET" || normalizedMethod === "HEAD") {
    return undefined;
  }

  return JSON.stringify(request);
}

/**
 * 문자열 또는 stream buffer를 의미 있는 frame/object로 파싱합니다.
 */
async function parseBackendBody(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!text) return null;

  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

/**
 * 외부 입력 또는 API 응답을 내부 화면 모델에 맞게 정규화합니다.
 */
function normalizeBackendSuccess(request, backendBody, contract) {
  if (
    backendBody &&
    typeof backendBody === "object" &&
    typeof backendBody.isSuccess === "boolean"
  ) {
    return backendBody;
  }

  return createBackendSuccessResponse(request, backendBody, contract);
}

/**
 * 외부 입력 또는 API 응답을 내부 화면 모델에 맞게 정규화합니다.
 */
function normalizeBackendError(request, response, backendBody, contract) {
  const status = response?.status || 500;
  const statusText = response?.statusText || "Backend Error";
  const backendMessage =
    backendBody?.message || backendBody?.error || backendBody?.detail;
  const error = createErrorResponse(
    request,
    backendMessage || `${status} ${statusText}`,
    `HTTP_${status}`
  );

  error.meta = {
    category: BRIDGE_CATEGORY.WEB_API,
    runtime: "backend",
    endpoint: contract.httpPath,
    method: contract.httpMethod,
    status,
    statusText,
    raw: backendBody,
  };

  return error;
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
async function requestBackend(request, contract) {
  const method = (contract.httpMethod || "POST").toUpperCase();
  const url = buildBackendUrl(contract, request);
  const response = await window.fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: pickRequestBody(method, request),
  });
  const backendBody = await parseBackendBody(response);

  if (!response.ok) {
    return normalizeBackendError(request, response, backendBody, contract);
  }

  return normalizeBackendSuccess(request, backendBody, contract);
}

export async function executeWebApi(type, payload = {}) {
  const contract = getContract(type, WebApiContract);
  const request = createBridgeRequest(payload);

  try {
    const response = await requestBackend(request, contract);

    if (!response.isSuccess) {
      throwIfErrorResponse(type, response, WebApiContract);
    }

    return response;
  } catch (error) {
    if (error?.response) throw error;

    const errorResponse = createErrorResponse(
      request,
      error,
      "BACKEND_CALL_ERROR"
    );
    errorResponse.meta = {
      category: BRIDGE_CATEGORY.WEB_API,
      runtime: "backend",
      endpoint: contract.httpPath,
      method: contract.httpMethod,
      status: 500,
    };

    throwIfErrorResponse(type, errorResponse, WebApiContract);
    return errorResponse;
  }
}
