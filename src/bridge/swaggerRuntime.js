/**
 * @file swaggerRuntime.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {
  ANDROID_TO_JS_PATH,
  BRIDGE_CATEGORY,
  JS_TO_ANDROID_PATH,
  WEB_API_PATH
} from "./bridgeConstants";
import { executeContract } from "./bridgeClient";

let originalFetch = null;

/**
 * getRequestUrl 처리 함수입니다.
 * @param {*} input 함수 실행에 필요한 입력값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getRequestUrl(input) {
  const rawUrl = typeof input === "string" ? input : input?.url || "";

  try {
    return new URL(rawUrl, window.location.origin).pathname;
  } catch {
    return String(rawUrl || "").split(/[?#]/)[0];
  }
}

/**
 * canUseBlob 처리 함수입니다.
 * @param {*} value 함수 실행에 필요한 입력값입니다.
 * @returns {boolean|*} 처리 결과를 반환합니다.
 */
function canUseBlob(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

/**
 * canUseRequest 처리 함수입니다.
 * @param {*} value 함수 실행에 필요한 입력값입니다.
 * @returns {boolean|*} 처리 결과를 반환합니다.
 */
function canUseRequest(value) {
  return typeof Request !== "undefined" && value instanceof Request;
}

/**
 * parseTextBody 처리 함수입니다.
 * @param {*} text 함수 실행에 필요한 입력값입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function parseTextBody(text) {
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { rawBody: text };
  }
}

/**
 * parsePayload 처리 함수입니다.
 * @param {*} input 함수 실행에 필요한 입력값입니다.
 * @param {*} init 함수 실행에 필요한 입력값입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
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

  if (body && typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
    return Object.fromEntries(body.entries());
  }

  return {};
}

/**
 * toContractType 처리 함수입니다.
 * @param {*} pathname 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function toContractType(pathname) {
  const lastSegment =
    String(pathname || "")
      .split("/")
      .filter(Boolean)
      .pop() || "";
  return decodeURIComponent(lastSegment).toUpperCase();
}

/**
 * resolveCategoryFromUrl 처리 함수입니다.
 * @param {*} pathname 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function resolveCategoryFromUrl(pathname) {
  if (pathname.includes(JS_TO_ANDROID_PATH)) return BRIDGE_CATEGORY.JS_TO_ANDROID;
  if (pathname.includes(ANDROID_TO_JS_PATH)) return BRIDGE_CATEGORY.ANDROID_TO_JS;
  if (pathname.includes(WEB_API_PATH)) return BRIDGE_CATEGORY.WEB_API;
  return null;
}

/**
 * createJsonResponse 처리 함수입니다.
 * @param {*} body 함수 실행에 필요한 입력값입니다.
 * @param {*} status 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function createJsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Contract Error",
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

/**
 * createFallbackError 처리 함수입니다.
 * @param {*} error 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
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
      detail: error?.message || "Contract execution failed"
    }
  };
}

/**
 * installSwaggerRuntime 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function installSwaggerRuntime() {
  if (originalFetch || typeof window === "undefined" || typeof window.fetch !== "function") return;

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

/**
 * uninstallSwaggerRuntime 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function uninstallSwaggerRuntime() {
  if (!originalFetch) return;

  window.fetch = originalFetch;
  originalFetch = null;
}
