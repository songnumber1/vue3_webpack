import {WebApiContract} from "./contract";
import {BRIDGE_CATEGORY} from "./bridgeConstants";
import {createBridgeRequest} from "./bridgeUtils";
import {
  createBackendSuccessResponse,
  createErrorResponse,
} from "./bridgeResponses";
import {getContract, throwIfErrorResponse} from "./bridgeValidation";

function getApiBaseUrl() {
  const configured = process.env.VUE_APP_API_BASE_URL || "/api";
  return configured.replace(/\/$/, "");
}

function interpolatePath(path, payload) {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, key) =>
    encodeURIComponent(payload?.[key] ?? "")
  );
}

function buildBackendUrl(contract, payload) {
  const rawPath =
    contract.httpPath || `/${contract.type?.toLowerCase?.() || ""}`;
  const path = interpolatePath(rawPath, payload);
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function pickRequestBody(method, request) {
  const normalizedMethod = method.toUpperCase();

  if (normalizedMethod === "GET" || normalizedMethod === "HEAD") {
    return undefined;
  }

  return JSON.stringify(request);
}

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
