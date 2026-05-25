/**
 * @file constants/apiConfig.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export const API_KEYS = Object.freeze({
  DEFAULT: "DEFAULT",
  GENERATION: "GENERATION",
  LOGIN: "LOGIN",
});

export const DEFAULT_API_POLICY = Object.freeze({
  overlay: true,
  abort: true,
});

export const API_CONFIG = Object.freeze({
  [API_KEYS.GENERATION]: Object.freeze({
    overlay: false,
    abort: true,
  }),
  [API_KEYS.LOGIN]: Object.freeze({
    overlay: true,
    abort: false,
  }),
});

export function resolveApiPolicy(apiKey) {
  const policy = API_CONFIG[apiKey] || {};
  return {
    overlay:
      typeof policy.overlay === "boolean"
        ? policy.overlay
        : DEFAULT_API_POLICY.overlay,
    abort:
      typeof policy.abort === "boolean"
        ? policy.abort
        : DEFAULT_API_POLICY.abort,
  };
}
