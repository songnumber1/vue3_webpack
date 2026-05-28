/**
 * @file constants/apiMode.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";

/**
 * 로컬 개발 환경(localhost, 내부 IP 등)에서 간혹 발생할 수 있는 HTTPS 인증서 통신 오류를 방지하기 위해,
 * 로컬 호스트 도메인을 타깃으로 하는 주소에 한해서만 `https://` 프로토콜을 `http://`로 강제 교정(Normalize)합니다.
 * @param {string} value - 정규화 검증을 진행할 기준 주소 URL 문자열
 * @returns {string} 로컬 조건에 부합 시 프로토콜이 교정된 URL, 그 외에는 공백 제거된 원본 문자열
 */
/**
 * 외부 입력 또는 API 응답을 내부 화면 모델에 맞게 정규화합니다.
 */
function normalizeLocalHttpUrl(value) {
  // 인자로 넘어온 값을 안전하게 문자열로 형변환한 후 좌우 공백을 제거합니다.
  const raw = String(value || "").trim();

  // 만약 공백을 제거한 결과가 빈 문자열("")이라면 더 이상 정규식을 돌릴 필요가 없으므로 즉시 반환합니다.
  if (!raw) return raw;

  // 대소문자 구분 없이 시작 부분이 'https://localhost', 'https://127.0.0.1', 'https://0.0.0.0' 또는 사설 IP 대역('https://192.168.x.x')이면서
  // 뒤이어 포트 번호가 붙거나 안 붙은 패턴을 찾아내어, 해당 도메인 본문($1)과 포트($2)는 유지하되 프로토콜만 'http://'로 바꾸어 반환합니다.
  return raw.replace(
    /^https:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+)(:\d+)?/i,
    "http://$1$2"
  );
}

/**
 * 프로젝트 전역 환경 변수(`VUE_APP_API_BASE_URL`)로부터 백엔드 서버의 기저 API 주소를 획득하여
 * 로컬 도메인 정규화를 거친 후 내보내는 최종 베이스 URL 상수입니다.
 * @type {string}
 * @see {@link normalizeLocalHttpUrl} 로컬 호스트 주소 가로채기 및 HTTP 교정 함수
 */
export const DEFAULT_API_BASE_PATH = "/api";

export const SERVER_API_BASE_URL = normalizeLocalHttpUrl(
  // Vue.js 환경 변수에 선언된 API 주소를 우선 채택하고, 정의되어 있지 않다면 폴백(Fallback) API 경로를 할당합니다.
  process.env.VUE_APP_API_BASE_URL || DEFAULT_API_BASE_PATH
);

/**
 * 클라이언트가 모크 데이터(가짜 데이터) 대신 실제 백엔드 서버 API를 바라보고 동작해야 하는 상황인지 판단합니다.
 * @returns {boolean} 실제 외부 서버와 통신해야 하는 상태면 true, 아니라면 false
 * @see {@link getRuntimeSystemSettings} 런타임 중에 변경될 수 있는 전역 시스템 제어 설정 스토어/유틸
 */
export function shouldUseServerApi() {
  // 현재 메모리에 적재된 시스템 설정 정보를 읽어와 실제 API 통신 플래그(`useRealApi`)가 온전히 true 값으로 셋팅되어 있는지 검사합니다.
  return getRuntimeSystemSettings().useRealApi === true;
}

/**
 * 프론트엔드 자체적인 가짜 데이터 모킹(Frontend Mock API) 모드로 동작해야 하는 상황인지 판단합니다.
 * @returns {boolean} 실제 서버를 쓰지 않고 모킹 처리를 수행해야 하는 상태면 true, 아니라면 false
 * @see {@link shouldUseServerApi} 서버 API 통신 판단 플래그 함수 (본 함수와 상반된 결과를 가집니다.)
 */
export function shouldUseFrontendMockApi() {
  // `shouldUseServerApi()` 함수의 결과값을 그대로 부정(`!`) 처리하여 모크 API 모드가 활성화되어야 하는 상태인지 반환합니다.
  return !shouldUseServerApi();
}
