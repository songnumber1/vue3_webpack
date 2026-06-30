/**
 * @file constants/appRuntimePolicy.js
 * @description 모바일 전용 앱에서 공유하는 최소 런타임 정책입니다.
 */

function readBooleanEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["true", "1", "yes", "y", "on"].includes(
    String(value).trim().toLowerCase()
  );
}

export const USE_REAL_API = readBooleanEnv(
  process.env.VUE_APP_SYSTEM_USE_REAL_API,
  true
);

export const APP_RUNTIME_POLICY = Object.freeze({
  useRealApi: USE_REAL_API,
});
