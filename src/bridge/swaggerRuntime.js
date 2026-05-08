import {
  ANDROID_TO_JS_PATH,
  BRIDGE_CATEGORY,
  JS_TO_ANDROID_PATH,
  WEB_API_PATH,
} from "./bridgeConstants";
import {executeContract} from "./bridgeClient";

let originalFetch = null;

function getRequestUrl(input) {
  return typeof input === "string" ? input : input?.url || "";
}

async function parsePayload(input, init = {}) {
  const body = init?.body;

  if (typeof body === "string") {
    return body ? JSON.parse(body) : {};
  }

  if (body instanceof Blob) {
    const text = await body.text();
    return text ? JSON.parse(text) : {};
  }

  if (input instanceof Request) {
    const text = await input.clone().text();
    return text ? JSON.parse(text) : {};
  }

  return {};
}

function toContractType(url) {
  return url.split("/").pop().toUpperCase();
}

function resolveCategoryFromUrl(url) {
  if (url.includes(JS_TO_ANDROID_PATH)) return BRIDGE_CATEGORY.JS_TO_ANDROID;
  if (url.includes(ANDROID_TO_JS_PATH)) return BRIDGE_CATEGORY.ANDROID_TO_JS;
  if (url.includes(WEB_API_PATH)) return BRIDGE_CATEGORY.WEB_API;
  return null;
}

function createJsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Contract Error",
    headers: {"Content-Type": "application/json"},
  });
}

function createFallbackError(error) {
  const now = new Date().toISOString();

  return {
    requestId: "swagger_error",
    requestDate: now,
    responseDate: now,
    isSuccess: false,
    code: "CONTRACT_ERROR",
    data: null,
    message: error?.message || "Contract execution failed",
    meta: {},
    error: {
      type: "CONTRACT_ERROR",
      detail: error?.message || "Contract execution failed",
    },
  };
}

export function installSwaggerRuntime() {
  if (originalFetch) return;

  originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    try {
      const url = getRequestUrl(input);
      const category = resolveCategoryFromUrl(url);

      if (category) {
        const type = toContractType(url);
        const payload = await parsePayload(input, init);
        const result = await executeContract(category, type, payload);

        return createJsonResponse(result, 200);
      }

      return originalFetch(input, init);
    } catch (error) {
      return createJsonResponse(
        error?.response || createFallbackError(error),
        error?.status || error?.response?.meta?.status || 400
      );
    }
  };
}

export function uninstallSwaggerRuntime() {
  if (!originalFetch) return;

  window.fetch = originalFetch;
  originalFetch = null;
}
