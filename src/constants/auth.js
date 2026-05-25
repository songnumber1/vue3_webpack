/**
 * @file constants/auth.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function readBooleanEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;

  return ["true", "1", "yes", "y"].includes(String(value).toLowerCase());
}

export const ENABLE_AUTH_GUARD = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD,
  true
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
