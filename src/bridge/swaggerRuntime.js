/**
 * @file swaggerRuntime.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {
  ANDROID_TO_JS_PATH,
  BRIDGE_CATEGORY,
  JS_TO_ANDROID_PATH,
  WEB_API_PATH,
} from "./bridgeConstants";
import {executeContract} from "./bridgeClient";

let originalFetch = null;

function getRequestUrl(input) {
  const rawUrl = typeof input === "string" ? input : input?.url || "";

  try {
    return new URL(rawUrl, window.location.origin).pathname;
  } catch {
    return String(rawUrl || "").split(/[?#]/)[0];
  }
}

function canUseBlob(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function canUseRequest(value) {
  return typeof Request !== "undefined" && value instanceof Request;
}

async function parseTextBody(text) {
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {rawBody: text};
  }
}

async function parsePayload(input, init = {}) {
  const body = init?.body;

  if (typeof body === "string") {
    return parseTextBody(body);
  }

  if (canUseBlob(body)) {
    return parseTextBody(await body.text());
  }

  if (canUseRequest(input)) {
    return parseTextBody(await input.clone().text());
  }

  if (
    body &&
    typeof URLSearchParams !== "undefined" &&
    body instanceof URLSearchParams
  ) {
    return Object.fromEntries(body.entries());
  }

  return {};
}

function toContractType(pathname) {
  const lastSegment =
    String(pathname || "")
      .split("/")
      .filter(Boolean)
      .pop() || "";
  return decodeURIComponent(lastSegment).toUpperCase();
}

function resolveCategoryFromUrl(pathname) {
  if (pathname.includes(JS_TO_ANDROID_PATH))
    return BRIDGE_CATEGORY.JS_TO_ANDROID;
  if (pathname.includes(ANDROID_TO_JS_PATH))
    return BRIDGE_CATEGORY.ANDROID_TO_JS;
  if (pathname.includes(WEB_API_PATH)) return BRIDGE_CATEGORY.WEB_API;
  return null;
}

function createJsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Contract Error",
    headers: {"Content-Type": "application/json; charset=utf-8"},
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
  if (
    originalFetch ||
    typeof window === "undefined" ||
    typeof window.fetch !== "function"
  )
    return;

  originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    try {
      const pathname = getRequestUrl(input);
      const category = resolveCategoryFromUrl(pathname);

      if (category) {
        const type = toContractType(pathname);
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
