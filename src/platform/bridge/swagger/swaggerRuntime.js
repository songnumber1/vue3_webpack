/**
 * @file platform/bridge/swagger/swaggerRuntime.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {
  ANDROID_TO_JS_PATH,
  BRIDGE_CATEGORY,
  JS_TO_ANDROID_PATH,
  WEB_API_PATH,
} from "../bridgeConstants";
import {executeContract} from "../web/bridgeClient";

let originalFetch = null;
/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
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
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function canUseBlob(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}
/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function canUseRequest(value) {
  return typeof Request !== "undefined" && value instanceof Request;
}
/**
 * 문자열 또는 stream buffer를 의미 있는 frame/object로 파싱합니다.
 */
async function parseTextBody(text) {
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {rawBody: text};
  }
}
/**
 * 문자열 또는 stream buffer를 의미 있는 frame/object로 파싱합니다.
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

  if (
    body &&
    typeof URLSearchParams !== "undefined" &&
    body instanceof URLSearchParams
  ) {
    return Object.fromEntries(body.entries());
  }

  return {};
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
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
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveCategoryFromUrl(pathname) {
  if (pathname.includes(JS_TO_ANDROID_PATH))
    return BRIDGE_CATEGORY.JS_TO_ANDROID;
  if (pathname.includes(ANDROID_TO_JS_PATH))
    return BRIDGE_CATEGORY.ANDROID_TO_JS;
  if (pathname.includes(WEB_API_PATH)) return BRIDGE_CATEGORY.WEB_API;

  return null;
}
/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createJsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Contract Error",
    headers: {"Content-Type": "application/json; charset=utf-8"},
  });
}
/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
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
