/**
 * @file api/mock/accessApi.mock.js
 * @description 개발/데모용 mock API 또는 mock 데이터입니다. 실제 API 비활성화 시 화면 동작을 보장합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {AUTH_MOCK_SCENARIOS} from "@/constants/auth";
import {ACCESS_INFO_RAW} from "@/api/mock/data/accessInfo.raw";
import {resolveMock} from "./mockUtils";

/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createAccessInfoResponse(payload = {}, options = {}) {
  const scenario = options.scenario || AUTH_MOCK_SCENARIOS.AUTHENTICATED;
  const base = {
    ...ACCESS_INFO_RAW,
    entryType: payload.entryType || ACCESS_INFO_RAW.entryType,
    chatId: payload.chatId || null,
  };

  if (scenario === AUTH_MOCK_SCENARIOS.LOGIN_REQUIRED) {
    return {
      ...base,
      valid: false,
      status: "Login",
      Login: true,
      user: null,
      isRagAuth: false,
    };
  }

  if (scenario === AUTH_MOCK_SCENARIOS.ACCESS_DENIED) {
    return {
      ...base,
      valid: false,
      status: "AccessDeny",
      AccessDeny: true,
      user: null,
      isRagAuth: false,
    };
  }

  if (scenario === AUTH_MOCK_SCENARIOS.USER_AGREE_REQUIRED) {
    return {
      ...base,
      valid: false,
      status: "UserAgree",
      UserAgree: true,
      isRagAuth: false,
    };
  }

  return base;
}

export const accessApiMock = {
  getAccessInfo(payload = {}, options = {}) {
    if (options.scenario === AUTH_MOCK_SCENARIOS.ERROR) {
      return Promise.reject(new Error("Mock access/info.do 인증 오류입니다."));
    }

    return resolveMock(createAccessInfoResponse(payload, options), 160);
  },
};
