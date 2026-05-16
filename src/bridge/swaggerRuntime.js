import {
// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
  ANDROID_TO_JS_PATH,
  BRIDGE_CATEGORY,
  JS_TO_ANDROID_PATH,
  WEB_API_PATH,
} from "./bridgeConstants";
import {executeContract} from "./bridgeClient";

let originalFetch = null;

/**
 * @description getRequestUrl 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} input - input 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getRequestUrl(input) {
  const rawUrl = typeof input === "string" ? input : input?.url || "";

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    // 계산된 결과를 호출부로 반환합니다.
    return new URL(rawUrl, window.location.origin).pathname;
  } catch {
    // 계산된 결과를 호출부로 반환합니다.
    return String(rawUrl || "").split(/[?#]/)[0];
  }
}

/**
 * @description canUseBlob 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function canUseBlob(value) {
  // 계산된 결과를 호출부로 반환합니다.
  return typeof Blob !== "undefined" && value instanceof Blob;
}

/**
 * @description canUseRequest 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function canUseRequest(value) {
  // 계산된 결과를 호출부로 반환합니다.
  return typeof Request !== "undefined" && value instanceof Request;
}

/**
 * @description parseTextBody 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} text - text 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
async function parseTextBody(text) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!text) return {};

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    // 계산된 결과를 호출부로 반환합니다.
    return JSON.parse(text);
  } catch {
    // 계산된 결과를 호출부로 반환합니다.
    return {rawBody: text};
  }
}

/**
 * @description parsePayload 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} input - input 입력값입니다.
 * @param {*} init - init 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
async function parsePayload(input, init = {}) {
  const body = init?.body;

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof body === "string") {
    // 계산된 결과를 호출부로 반환합니다.
    return parseTextBody(body);
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (canUseBlob(body)) {
    // 계산된 결과를 호출부로 반환합니다.
    return parseTextBody(await body.text());
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (canUseRequest(input)) {
    // 계산된 결과를 호출부로 반환합니다.
    return parseTextBody(await input.clone().text());
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (
    body &&
    typeof URLSearchParams !== "undefined" &&
    body instanceof URLSearchParams
  ) {
    // 계산된 결과를 호출부로 반환합니다.
    return Object.fromEntries(body.entries());
  }

  // 계산된 결과를 호출부로 반환합니다.
  return {};
}

/**
 * @description toContractType 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} pathname - pathname 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function toContractType(pathname) {
  const lastSegment =
    String(pathname || "")
      .split("/")
      .filter(Boolean)
      .pop() || "";
  // 계산된 결과를 호출부로 반환합니다.
  return decodeURIComponent(lastSegment).toUpperCase();
}

/**
 * @description resolveCategoryFromUrl 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} pathname - pathname 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function resolveCategoryFromUrl(pathname) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (pathname.includes(JS_TO_ANDROID_PATH))
    // 계산된 결과를 호출부로 반환합니다.
    return BRIDGE_CATEGORY.JS_TO_ANDROID;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (pathname.includes(ANDROID_TO_JS_PATH))
    // 계산된 결과를 호출부로 반환합니다.
    return BRIDGE_CATEGORY.ANDROID_TO_JS;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (pathname.includes(WEB_API_PATH)) return BRIDGE_CATEGORY.WEB_API;
  // 계산된 결과를 호출부로 반환합니다.
  return null;
}

/**
 * @description createJsonResponse 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} body - body 입력값입니다.
 * @param {*} status - status 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createJsonResponse(body, status = 200) {
  // 계산된 결과를 호출부로 반환합니다.
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Contract Error",
    headers: {"Content-Type": "application/json; charset=utf-8"},
  });
}

/**
 * @description createFallbackError 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} error - error 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createFallbackError(error) {
  const now = new Date().toISOString();

  // 계산된 결과를 호출부로 반환합니다.
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

/**
 * @description installSwaggerRuntime 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function installSwaggerRuntime() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (
    originalFetch ||
    typeof window === "undefined" ||
    typeof window.fetch !== "function"
  )
    return;

  originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
    try {
      const pathname = getRequestUrl(input);
      const category = resolveCategoryFromUrl(pathname);

      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (category) {
        const type = toContractType(pathname);
        const payload = await parsePayload(input, init);
        const result = await executeContract(category, type, payload);

        // 계산된 결과를 호출부로 반환합니다.
        return createJsonResponse(result, 200);
      }

      // 계산된 결과를 호출부로 반환합니다.
      return originalFetch(input, init);
    } catch (error) {
      // 계산된 결과를 호출부로 반환합니다.
      return createJsonResponse(
        error?.response || createFallbackError(error),
        error?.status || error?.response?.meta?.status || 400
      );
    }
  };
}

/**
 * @description uninstallSwaggerRuntime 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function uninstallSwaggerRuntime() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!originalFetch) return;

  window.fetch = originalFetch;
  originalFetch = null;
}
