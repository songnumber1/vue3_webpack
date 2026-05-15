/**
 * @file authStore.js
 * @description access/info.do 인증 결과와 사용자 접근 권한을 관리하는 Pinia store입니다.
 */

import {defineStore} from "pinia";

/**
 * 인증/접근 권한 전역 상태 store입니다.
 *
 * state: accessInfo, user, isAuthenticated, authFailureReason
 * 특징: 라우터 가드와 chat runtime bootstrap이 동일한 accessInfo를 공유하도록 원본 응답도 함께 보관합니다.
 */
export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessInfo: null,
    user: null,
    isRagAuth: false,
    sourceOptions: [],
    externalOptions: [],
    authChecked: false,
    isAuthenticated: false,
    authFailureReason: null,
    authErrorMessage: "",
  }),
  getters: {
    /** @returns {string} 현재 로그인 사용자 이름입니다. */
    userName: (state) => state.user?.userName || "",
    /** @returns {string} 현재 로그인 사용자 ID입니다. */
    userId: (state) => state.user?.userId || "",
  },
  actions: {
    /**
     * access/info.do 응답을 사용자 상태로 저장합니다.
     *
     * method: setAccessInfo
     * payload: access/info.do response
     * response: Pinia auth state 업데이트
     * 특징: runtime bootstrap에서 재사용할 수 있도록 raw accessInfo를 함께 저장합니다.
     *
     * @param {object} accessInfo - access/info.do 응답 객체입니다.
     * @returns {void}
     */
    setAccessInfo(accessInfo = {}) {
      this.accessInfo = accessInfo || null;
      this.user = accessInfo?.user || null;
      this.isRagAuth = Boolean(accessInfo?.isRagAuth);
      this.sourceOptions = accessInfo?.sourceOptions || [];
      this.externalOptions = accessInfo?.externalOptions || [];
    },

    /**
     * 로그인 확인 성공 응답을 저장합니다.
     *
     * @param {object} accessInfo - access/info.do 응답 객체입니다.
     * @returns {void}
     */
    setAuthenticatedAccessInfo(accessInfo = {}) {
      this.setAccessInfo(accessInfo);
      this.authChecked = true;
      this.isAuthenticated = true;
      this.authFailureReason = null;
      this.authErrorMessage = "";
    },

    /**
     * 로그인 확인 실패 상태를 저장합니다.
     *
     * @param {string} reason - LOGIN_REQUIRED, ACCESS_DENIED, USER_AGREE_REQUIRED 등의 실패 사유입니다.
     * @param {object} accessInfo - access/info.do 응답 객체입니다.
     * @returns {void}
     */
    setAuthFailure(reason, accessInfo = {}) {
      this.setAccessInfo(accessInfo);
      this.authChecked = true;
      this.isAuthenticated = false;
      this.authFailureReason = reason;
      this.authErrorMessage = "";
    },

    /**
     * 로그인 확인 API 오류 상태를 저장합니다.
     *
     * @param {Error} error - 로그인 확인 전용 axios 또는 mock API 오류입니다.
     * @returns {void}
     */
    setAuthError(error) {
      this.accessInfo = null;
      this.user = null;
      this.isRagAuth = false;
      this.sourceOptions = [];
      this.externalOptions = [];
      this.authChecked = true;
      this.isAuthenticated = false;
      this.authFailureReason = "AUTH_ERROR";
      this.authErrorMessage =
        error?.message || "로그인 확인 중 오류가 발생했습니다.";
    },

    /**
     * 인증 상태를 초기화합니다.
     *
     * method: resetAuth
     * payload: 없음
     * response: 인증 관련 state 초기화
     * 특징: 로그아웃, 세션 만료, 테스트 시나리오 변경 시 사용합니다.
     *
     * @returns {void}
     */
    resetAuth() {
      this.accessInfo = null;
      this.user = null;
      this.isRagAuth = false;
      this.sourceOptions = [];
      this.externalOptions = [];
      this.authChecked = false;
      this.isAuthenticated = false;
      this.authFailureReason = null;
      this.authErrorMessage = "";
    },
  },
});
