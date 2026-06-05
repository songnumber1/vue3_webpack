/**
 * @file stores/chatStreamStore.js
 * @description Pinia 전역 상태 저장소입니다. 화면 간 공유되어야 하는 business/runtime 상태를 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {defineStore} from "pinia";

/**
 * @description AI 모델이 토큰 스트리밍 응답(텍스트 한 글자씩 실시간 드로잉 타자 모션)을 뱉어내고 있는 도중인지 판별하여
 * 입력창 전송 버튼 잠금 및 자동 스크롤 하단 포커싱 트리거를 홀딩 보존하는 스토어입니다.
 */
export const useChatStreamStore = defineStore("chatStream", {
  // 스트리밍 플래그 상태 정의
  state: () => ({
    isStreaming: false, // 현재 AI 모델 인프라가 대화 패킷을 타이핑 중인지 판별 플래그
    /**
     * 새 채팅 생성 직후 프론트 내부에서 수행하는 /chat/:id 라우팅만
     * 스트리밍 중 1회 통과시키기 위한 임시 허용권입니다.
     * 사용자 클릭 이동, 다른 대화방 이동, Studio/MCP 이동 허용 용도가 아닙니다.
     */
    allowedNavigation: null,
  }),
  actions: {
    /**
     * AI 생성 인터페이스 가동 직전, 스트리밍 상태의 시작 신호탄을 점등 마킹합니다.
     */
    start() {
      this.isStreaming = true; // 스트리밍 가동 잠금 잠금 활성화
    },
    /**
     * AI가 마침표 토큰을 수신 완료했거나 통신 소켓 세션이 종료 완료되어 출력을 종료했음을 알리고 락을 해제합니다.
     */
    finish() {
      this.isStreaming = false; // 잠금 전면 해제 릴리즈
      this.clearAllowedNavigation();
    },
    /**
     * 새 채팅 생성 직후 /chat/:id로 이동하는 내부 라우팅만 1회 허용합니다.
     * 이 허용권은 router.push({name: "chat", params: {id}}) 직전에만 설정되며,
     * 사용자 클릭/다른 라우트 이동은 기존처럼 스트리밍 가드가 차단합니다.
     * @param {object} route - 허용할 라우트 대상
     */
    allowNavigationTo(route = {}) {
      this.allowedNavigation = {
        name: route.name || null,
        params: {...(route.params || {})},
      };
    },
    /**
     * 전역 라우터 가드에서 스트리밍 중 허용된 내부 라우팅인지 확인하고,
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
        ([key, value]) =>
          String(to.params?.[key] || "") === String(value || "")
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
