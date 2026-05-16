import {AUTH_MOCK_SCENARIOS} from "@/constants/auth";
import {ACCESS_INFO_RAW} from "@/data/raw/accessInfo.raw";
import {resolveMock} from "./mockUtils";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description createAccessInfoResponse 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} payload - payload 입력값입니다.
 * @param {*} options - options 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createAccessInfoResponse(payload = {}, options = {}) {
  const scenario = options.scenario || AUTH_MOCK_SCENARIOS.AUTHENTICATED;
  const base = {
    ...ACCESS_INFO_RAW,
    entryType: payload.entryType || ACCESS_INFO_RAW.entryType,
    chatId: payload.chatId || null,
  };

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (scenario === AUTH_MOCK_SCENARIOS.LOGIN_REQUIRED) {
    // 계산된 결과를 호출부로 반환합니다.
    return {
      ...base,
      valid: false,
      status: "Login",
      Login: true,
      user: null,
      isRagAuth: false,
    };
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (scenario === AUTH_MOCK_SCENARIOS.ACCESS_DENIED) {
    // 계산된 결과를 호출부로 반환합니다.
    return {
      ...base,
      valid: false,
      status: "AccessDeny",
      AccessDeny: true,
      user: null,
      isRagAuth: false,
    };
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (scenario === AUTH_MOCK_SCENARIOS.USER_AGREE_REQUIRED) {
    // 계산된 결과를 호출부로 반환합니다.
    return {
      ...base,
      valid: false,
      status: "UserAgree",
      UserAgree: true,
      isRagAuth: false,
    };
  }

  // 계산된 결과를 호출부로 반환합니다.
  return base;
}

export const accessApiMock = {
  getAccessInfo(payload = {}, options = {}) {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (options.scenario === AUTH_MOCK_SCENARIOS.ERROR) {
      // 계산된 결과를 호출부로 반환합니다.
      return Promise.reject(new Error("Mock access/info.do 인증 오류입니다."));
    }

    // 계산된 결과를 호출부로 반환합니다.
    return resolveMock(createAccessInfoResponse(payload, options), 160);
  },
};
