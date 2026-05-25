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
    },
  },
});
