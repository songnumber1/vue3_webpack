import {AUTH_MOCK_SCENARIOS} from "@/constants/auth";
import {ACCESS_INFO_RAW} from "@/data/raw/accessInfo.raw";
import {resolveMock} from "./mockUtils";

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
