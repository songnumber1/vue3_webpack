/**
 * @file stores/chatStreamStore.js
 * @description Pinia 전역 상태 저장소입니다. 화면 간 공유되어야 하는 business/runtime 상태를 관리합니다.
 */

import {defineStore} from "pinia";

/**
 * @description 채팅 질문 전송 후 답변 성공/실패/취소가 확정되기 전까지
 * 사용자 이동과 중복 전송을 막는 대기 상태를 관리합니다.
 */
export const useChatStreamStore = defineStore("chatStream", {
  state: () => ({
    isWait: false,
    /**
     * 새 채팅 생성 직후 프론트 내부에서 수행하는 hidden-only /chat entry 라우팅만
     * 대기 중 1회 통과시키기 위한 임시 허용권입니다.
     * 사용자 클릭 이동, 다른 대화방 이동, Studio/MCP 이동 허용 용도가 아닙니다.
     */
    allowedNavigation: null,
  }),
  actions: {
    /**
     * 채팅 질문 전송 직후, 답변 처리 완료 전까지의 대기 상태를 시작합니다.
     */
    startWait() {
      this.isWait = true;
    },
    /**
     * 답변 성공/실패/취소/예외 처리 완료 후 대기 상태를 해제합니다.
     */
    finishWait() {
      this.isWait = false;
      this.clearAllowedNavigation();
    },
    /**
     * 기존 호출부 호환용 별칭입니다.
     */
    start() {
      this.startWait();
    },
    /**
     * 기존 호출부 호환용 별칭입니다.
     */
    finish() {
      this.finishWait();
    },
    /**
     * 새 채팅 생성 직후 hidden-only /chat entry로 이동하는 내부 라우팅만 1회 허용합니다.
     * 이 허용권은 새 채팅 생성 후 router.push/replace 직전에만 설정되며,
     * 사용자 클릭/다른 라우트 이동은 기존처럼 대기 가드가 차단합니다.
     * @param {object} route - 허용할 라우트 대상
     */
    allowNavigationTo(route = {}) {
      this.allowedNavigation = {
        name: route.name || null,
        params: {...(route.params || {})},
      };
    },
    /**
     * 전역 라우터 가드에서 대기 중 허용된 내부 라우팅인지 확인하고,
     * 일치하면 허용권을 즉시 소모합니다. 한 번 소모된 허용권은 재사용되지 않습니다.
     * @param {object} to - Vue Router의 목적지 라우트
     * @returns {boolean} 허용 여부
     */
    consumeAllowedNavigation(to = {}) {
      const allowed = this.allowedNavigation;
      if (!allowed) return false;

      const isSameName =
        !allowed.name || String(to.name) === String(allowed.name);
      const isSameParams = Object.entries(allowed.params || {}).every(
        ([key, value]) => String(to.params?.[key] || "") === String(value || "")
      );

      if (isSameName && isSameParams) {
        this.clearAllowedNavigation();
        return true;
      }

      return false;
    },
    /**
     * 내부 라우팅 허용권을 명시적으로 폐기합니다.
     */
    clearAllowedNavigation() {
      this.allowedNavigation = null;
    },
  },
});
