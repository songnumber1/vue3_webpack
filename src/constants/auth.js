/**
 * @description readBooleanEnv 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @param {*} fallback - fallback 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function readBooleanEnv(value, fallback) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (value === undefined || value === null || value === "") return fallback;
  // 계산된 결과를 호출부로 반환합니다.
  return ["true", "1", "yes", "y"].includes(String(value).toLowerCase());
}

export const ENABLE_AUTH_GUARD = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD,
  false
);

export const USE_MOCK_AUTH = readBooleanEnv(
  process.env.VUE_APP_USE_MOCK_AUTH,
  false
);

export const ALLOW_LOCAL_STORAGE_MOCK_AUTH = readBooleanEnv(
  process.env.VUE_APP_ALLOW_LOCAL_STORAGE_MOCK_AUTH,
  false
);

export const AUTH_MOCK_SCENARIO_STORAGE_KEY = "DS_AUTH_MOCK_SCENARIO";

export const AUTH_MOCK_SCENARIOS = Object.freeze({
  AUTHENTICATED: "authenticated",
  LOGIN_REQUIRED: "login",
  ACCESS_DENIED: "access-denied",
  USER_AGREE_REQUIRED: "user-agree",
  ERROR: "error",
});

export const AUTH_FAILURE_REASONS = Object.freeze({
  AUTHENTICATED: "AUTHENTICATED",
  LOGIN_REQUIRED: "LOGIN_REQUIRED",
  ACCESS_DENIED: "ACCESS_DENIED",
  USER_AGREE_REQUIRED: "USER_AGREE_REQUIRED",
  AUTH_ERROR: "AUTH_ERROR",
});

export const ENABLE_AUTH_GUARD_CACHE = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD_CACHE,
  false
);

export const ENABLE_AUTH_GUARD_DEBUG = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD_DEBUG,
  false
);
