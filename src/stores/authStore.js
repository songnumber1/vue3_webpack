import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isRagAuth: false,
    sourceOptions: [],
    externalOptions: [],
    authChecked: false,
    isAuthenticated: false,
    authFailureReason: null,
    authErrorMessage: '',
  }),
  getters: {
    userName: (state) => state.user?.userName || '',
    userId: (state) => state.user?.userId || '',
  },
  actions: {
    /**
     * access/info.do 응답을 사용자 상태로 저장합니다.
     *
     * method: setAccessInfo
     * payload: access/info.do response
     * response: Pinia auth state 업데이트
     *
     * @param {object} accessInfo - access/info.do 응답 객체입니다.
     * @returns {void}
     */
    setAccessInfo(accessInfo = {}) {
      this.user = accessInfo.user || null
      this.isRagAuth = Boolean(accessInfo.isRagAuth)
      this.sourceOptions = accessInfo.sourceOptions || []
      this.externalOptions = accessInfo.externalOptions || []
    },

    /**
     * 로그인 확인 성공 응답을 저장합니다.
     *
     * @param {object} accessInfo - access/info.do 응답 객체입니다.
     * @returns {void}
     */
    setAuthenticatedAccessInfo(accessInfo = {}) {
      this.setAccessInfo(accessInfo)
      this.authChecked = true
      this.isAuthenticated = true
      this.authFailureReason = null
      this.authErrorMessage = ''
    },

    /**
     * 로그인 확인 실패 상태를 저장합니다.
     *
     * @param {string} reason - LOGIN_REQUIRED, ACCESS_DENIED, USER_AGREE_REQUIRED 등의 실패 사유입니다.
     * @param {object} accessInfo - access/info.do 응답 객체입니다.
     * @returns {void}
     */
    setAuthFailure(reason, accessInfo = {}) {
      this.setAccessInfo(accessInfo)
      this.authChecked = true
      this.isAuthenticated = false
      this.authFailureReason = reason
      this.authErrorMessage = ''
    },

    /**
     * 로그인 확인 API 오류 상태를 저장합니다.
     *
     * @param {Error} error - 로그인 확인 전용 axios 또는 mock API 오류입니다.
     * @returns {void}
     */
    setAuthError(error) {
      this.user = null
      this.authChecked = true
      this.isAuthenticated = false
      this.authFailureReason = 'AUTH_ERROR'
      this.authErrorMessage = error?.message || '로그인 확인 중 오류가 발생했습니다.'
    },
  },
})
