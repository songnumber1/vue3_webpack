import { AUTH_MOCK_SCENARIOS } from '@/constants/auth'
import { ACCESS_INFO_RAW } from '@/data/raw/accessInfo.raw'
import { resolveMock } from './mockUtils'

/**
 * access/info.do mock 응답을 인증 시나리오에 맞게 생성합니다.
 *
 * method: POST
 * payload: { language, entryType, shareId, chatId, msgId, studioId }
 * response: access/info.do 응답 body
 *
 * @param {object} payload - access/info.do 요청 payload입니다.
 * @param {object} options - mock 응답 옵션입니다.
 * @param {string} options.scenario - authenticated/login/access-denied/user-agree/error 중 하나입니다.
 * @returns {object} access/info.do mock response입니다.
 */
function createAccessInfoResponse(payload = {}, options = {}) {
  const scenario = options.scenario || AUTH_MOCK_SCENARIOS.AUTHENTICATED
  const base = {
    ...ACCESS_INFO_RAW,
    entryType: payload.entryType || ACCESS_INFO_RAW.entryType,
    chatId: payload.chatId || null,
  }

  if (scenario === AUTH_MOCK_SCENARIOS.LOGIN_REQUIRED) {
    return {
      ...base,
      valid: false,
      status: 'Login',
      Login: true,
      user: null,
      isRagAuth: false,
    }
  }

  if (scenario === AUTH_MOCK_SCENARIOS.ACCESS_DENIED) {
    return {
      ...base,
      valid: false,
      status: 'AccessDeny',
      AccessDeny: true,
      user: null,
      isRagAuth: false,
    }
  }

  if (scenario === AUTH_MOCK_SCENARIOS.USER_AGREE_REQUIRED) {
    return {
      ...base,
      valid: false,
      status: 'UserAgree',
      UserAgree: true,
      isRagAuth: false,
    }
  }

  return base
}

export const accessApiMock = {
  /**
   * access/info.do mock API를 실제 axios 호출처럼 비동기로 반환합니다.
   *
   * method: POST
   * payload: { language, entryType, shareId, chatId, msgId, studioId }
   * response: access/info.do 응답 body
   *
   * @param {object} payload - 로그인 확인 요청 payload입니다.
   * @param {object} options - mock 인증 시나리오 옵션입니다.
   * @returns {Promise<object>} access/info.do mock response입니다.
   */
  getAccessInfo(payload = {}, options = {}) {
    if (options.scenario === AUTH_MOCK_SCENARIOS.ERROR) {
      return Promise.reject(new Error('Mock access/info.do 인증 오류입니다.'))
    }

    return resolveMock(createAccessInfoResponse(payload, options), 160)
  },
}
