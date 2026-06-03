/**
 * @file adapters/authResponseAdapter.js
 * @description 백엔드/mock 원본 응답을 화면에서 쓰기 쉬운 형태로 정규화하는 adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {AUTH_FAILURE_REASONS} from "@/constants/auth";
import {AUTH_API_KEYS as A} from "@/constants/api/authApiKeys";
import {API_RESPONSE_KEYS as R} from "@/constants/api/apiResponseKeys";
import {unwrapApiBody} from "@/utils/apiResponseReader";
import {toBoolean} from "@/utils/booleanUtils";

/** 로그인 재요청 판별을 위한 문자열 상태 집합 (Set) */
const LOGIN_STATUSES = new Set(["login", "login_required", "login-required"]);

/** 접근 거부 상태를 판별하기 위한 문자열 상태 집합 (Set) */
const ACCESS_DENIED_STATUSES = new Set([
  "accessdeny",
  "access_denied",
  "access-denied",
]);

/** 약관 동의 필요 상태를 판별하기 위한 문자열 상태 집합 (Set) */
const USER_AGREEMENT_STATUSES = new Set([
  "useragree",
  "user_agree",
  "user-agree",
]);

const ACCESS_TOKEN_KEYS = [A.ACCESS_TOKEN, A.ACCESS_TOKEN_SNAKE];
const REFRESH_TOKEN_KEYS = [A.REFRESH_TOKEN, A.REFRESH_TOKEN_SNAKE];

const AUTH_SUCCESS_KEYS = [A.SUCCESS, R.SUCCESS, R.OK];
const AUTH_CODE_KEYS = [A.CODE, R.CODE];
const AUTH_MESSAGE_KEYS = [A.MESSAGE, R.MESSAGE, R.ERROR_MESSAGE];
const AUTH_PATH_KEYS = [A.PATH, R.PATH];
const AUTH_USER_KEYS = [A.USER, "User", "userInfo", "UserInfo"];
const AUTH_STATUS_KEYS = [R.STATUS, "Status", R.RESULT, "Result"];
const AUTH_VALID_KEYS = [A.VALID, R.VALID, "Valid", "isValid", "IsValid"];


/**
 * 소스 객체 내부에 찾고자 하는 다수의 후보 키(Keys) 배열 중 매칭되는 첫 번째 프로퍼티 값을 안전하게 추출합니다.
 * @param {Object} source - 검색 대상이 될 원본 데이터 객체
 * @param {Array<string>} keys - 프로퍼티 키 매칭 후보군 목록 (우선순위 순)
 * @returns {*} 매칭된 프로퍼티의 값 (찾지 못했거나 객체가 아니면 undefined)
 */
function findObjectValue(source, keys) {
  // 원본 데이터가 실재하지 않거나 객체 타입이 아니라면 탐색이 불가능하므로 즉시 undefined를 반환합니다.
  if (!source || typeof source !== "object") return undefined;

  // 후보 키 배열을 순차적으로 돕니다.
  for (const key of keys) {
    // 프로토타입 체인을 오염시키지 않고 객체 자체의 고유 속성으로 해당 키가 존재하는지 검사합니다.
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      // 존재한다면 해당 시점의 값을 즉시 반환하며 반복문을 조기 종료합니다.
      return source[key];
    }
  }

  // 모든 후보 키를 돌았음에도 매칭되는 속성이 없다면 undefined를 반환합니다.
  return undefined;
}

/**
 * 상태 값 문자열의 대소문자 혼재 및 공백 처리를 단일 포맷으로 정리합니다.
 * @param {*} value - 정규화할 원본 상태 값
 * @returns {string} 소문자 및 좌우 공백이 제거되어 규격화된 상태 문자열
 */
function normalizeStatus(value) {
  // 전달된 값을 문자열로 캐스팅하고 공백을 자른 뒤, 소문자로 강제 치환합니다.
  return String(value || "")
    .trim()
    .toLowerCase();
}

function readAuthValue(source, keys, fallback = undefined) {
  const body = unwrapApiBody(source, source);
  const value = findObjectValue(body, keys);
  return value === undefined ? fallback : value;
}

function normalizeOptionalBoolean(value) {
  return value === undefined ? undefined : toBoolean(value);
}

export function unwrapAuthResponseBody(response, fallback = {}) {
  return unwrapApiBody(response, fallback) || fallback;
}

export function adaptAuthTokens(source = {}, fallbackRefreshToken = "") {
  const body = unwrapAuthResponseBody(source, {});
  const accessToken = readAuthValue(body, ACCESS_TOKEN_KEYS, "") || "";
  const refreshToken =
    readAuthValue(body, REFRESH_TOKEN_KEYS, "") || fallbackRefreshToken || "";

  return {
    accessToken,
    refreshToken,
    raw: body,
  };
}

export function adaptAuthApiResponse(response = {}) {
  const body = unwrapAuthResponseBody(response, {});

  return {
    ...body,
    success: normalizeOptionalBoolean(
      readAuthValue(body, AUTH_SUCCESS_KEYS, undefined)
    ),
    code: readAuthValue(body, AUTH_CODE_KEYS, undefined),
    message: readAuthValue(body, AUTH_MESSAGE_KEYS, ""),
    path: readAuthValue(body, AUTH_PATH_KEYS, ""),
    authenticated: normalizeOptionalBoolean(
      readAuthValue(body, [A.AUTHENTICATED], undefined)
    ),
    authMode: readAuthValue(body, [A.AUTH_MODE], ""),
    user: readAuthValue(body, AUTH_USER_KEYS, null),
    accessToken: readAuthValue(body, ACCESS_TOKEN_KEYS, "") || "",
    refreshToken: readAuthValue(body, REFRESH_TOKEN_KEYS, "") || "",
    expiresIn: readAuthValue(body, [A.EXPIRES_IN], undefined),
    tokenType: readAuthValue(body, [A.TOKEN_TYPE], ""),
    raw: body,
  };
}

/**
 * 전달받은 비정형화된 인증 접근 정보 객체를 분석하여 일관된 스펙의 논리 플래그 플랫 객체로 변환합니다.
 * @param {Object} [accessInfo={}] - 서버 혹은 외부 API로부터 주입받은 원본 접근 정보 객체
 * @returns {Object} 1차 정형화 완료된 인증 접근 데이터 객체
 * @see {@link findObjectValue} 키 후보군을 바탕으로 파편화된 프로퍼티를 찾아주는 유틸 함수
 * @see {@link normalizeStatus} 문자열 포맷 정문화 유틸 함수
 * @see {@link toBoolean} 참/거짓 형태 다변화 정형화 유틸 함수
 */
export function normalizeAuthAccessInfo(accessInfo = {}) {
  // 1. 상태(status) 키 후보군을 조회하여 문자열 소문자 정형화를 적용합니다.
  const status = normalizeStatus(
    findObjectValue(accessInfo, AUTH_STATUS_KEYS)
  );

  // 2. 토큰 유효 여부(valid) 관련 키 후보군을 안전하게 확보합니다.
  const valid = findObjectValue(accessInfo, AUTH_VALID_KEYS);

  // 3. 내부 유저 세부 정보 객체(user) 관련 키 후보군을 확보합니다.
  const user = findObjectValue(accessInfo, AUTH_USER_KEYS);

  // 4. [로그인 요구 여부 종합 판단] 토큰이 유효하지 않거나(valid === false), 상태 세트 목록에 걸리거나, 로그인 요구 플래그 문자열이 참이거나, 유저 정보 자체가 없으면 로그인이 필요한 상태로 단언합니다.
  const loginRequired =
    valid === false ||
    LOGIN_STATUSES.has(status) ||
    toBoolean(
      findObjectValue(accessInfo, [
        "loginRequired",
        "LoginRequired",
        "login",
        "Login",
      ])
    ) ||
    !user;

  // 5. [접근 거부 여부 종합 판단] 거부 상태 세트에 속해있거나 별도의 accessDeny 불리언/문자열 플래그가 참으로 판명되면 접근 거부 상태로 지정합니다.
  const accessDenied =
    ACCESS_DENIED_STATUSES.has(status) ||
    toBoolean(
      findObjectValue(accessInfo, [
        "accessDeny",
        "AccessDeny",
        "accessDenied",
        "AccessDenied",
      ])
    );

  // 6. [서비스 이용약관 동의 요구 여부 종합 판단] 약관동의 필수 상태 세트에 걸리거나 유저 동의 요구 플래그가 참으로 식별되면 약관동의 화면 진입 대상으로 지정합니다.
  const userAgreementRequired =
    USER_AGREEMENT_STATUSES.has(status) ||
    toBoolean(
      findObjectValue(accessInfo, [
        "userAgree",
        "UserAgree",
        "userAgreementRequired",
        "UserAgreementRequired",
      ])
    );

  // 비즈니스 제어문(라우터 가드 등)에서 가독성 있게 다이렉트 바인딩할 수 있도록 정문화 포맷 객체 구조로 묶어 반환합니다.
  return {
    raw: accessInfo, // 원본 유실 방지를 위한 순수 오리지널 객체 백업
    status, // 정형화된 상태 문자열
    valid, // 원본 유효 플래그 상태값
    user, // 원본 유저 세부 정보 객체
    loginRequired, // [최종] 로그인 필요 여부 플래그 (Boolean)
    accessDenied, // [최종] 차단 여부 플래그 (Boolean)
    userAgreementRequired, // [최종] 회원가입 약관 동의 필요 여부 플래그 (Boolean)
  };
}

/**
 * 정문화된 접근 정보를 바탕으로 현재 접속 시도의 최종 실패 사유(Reason) 또는 인증 성공 상태를 라우팅 분기용 규격 객체로 풀어냅니다.
 * @param {Object} [accessInfo={}] - 서버 혹은 외부 API로부터 주입받은 원본 접근 정보 객체
 * @returns {Object} 최종 인증 처리 결과 통제 객체 (`authenticated`, `reason`, `accessInfo` 구조)
 * @see {@link normalizeAuthAccessInfo} 1차 논리 플래그 정형화 추출 함수
 * @see {@link AUTH_FAILURE_REASONS} 인증 실패/성공 사유가 바인딩된 글로벌 공통 정의 상수
 */
export function resolveAuthAccessResult(accessInfo = {}) {
  // 1. 우선 원본 정보 객체를 일관된 규격 플래그 세트로 변환 처리합니다.
  const normalized = normalizeAuthAccessInfo(accessInfo);

  // 2. [체크 순위 1] 만약 접근 자체가 금지/차단된 대상인 경우,
  if (normalized.accessDenied) {
    return {
      authenticated: false, // 인증 통과 안 됨을 선언
      reason: AUTH_FAILURE_REASONS.ACCESS_DENIED, // 사유: 접근 거부 계정 혹은 권한 오류
      accessInfo: normalized.raw, // 원본 컨텍스트 반환
      normalizedAccessInfo: normalized, // 정문화 컨텍스트 동시 제공
    };
  }

  // 3. [체크 순위 2] 차단은 안 되었으나 필수 가입/마케팅 약관 서명이 필요한 신규 회원 계정인 경우,
  if (normalized.userAgreementRequired) {
    return {
      authenticated: false, // 인증 통과 잠정 보류
      reason: AUTH_FAILURE_REASONS.USER_AGREE_REQUIRED, // 사유: 약관 동의 서명 페이지 리다이렉트 필요
      accessInfo: normalized.raw,
      normalizedAccessInfo: normalized,
    };
  }

  // 4. [체크 순위 3] 세션 만료, 미인증 상태 혹은 토큰 변질 등으로 인해 재로그인이 요구되는 경우,
  if (normalized.loginRequired) {
    return {
      authenticated: false, // 인증 통과 실패
      reason: AUTH_FAILURE_REASONS.LOGIN_REQUIRED, // 사유: 로그인 페이지 폼 리다이렉트 필요
      accessInfo: normalized.raw,
      normalizedAccessInfo: normalized,
    };
  }

  // 5. [최종 패스] 상기 서술된 모든 제한 조건(차단, 약관동의 누락, 미로그인)을 완벽히 통과한 검증된 회원의 경우,
  return {
    authenticated: true, // 정상 인증 완결 상태 처리
    reason: AUTH_FAILURE_REASONS.AUTHENTICATED, // 사유: 인증 성공 및 서비스 이용 허가
    accessInfo: normalized.raw,
    normalizedAccessInfo: normalized,
  };
}
