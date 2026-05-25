/**
 * @file composables/runtime/useInteractionGuard.js
 * @description 런타임 상호작용 제한, 모바일/WebView 환경 상태 같은 전역 동작 제어 composable입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {useChatStreamStore} from "@/stores/chatStreamStore";

/**
 * @description AI의 실시간 답변 스트리밍 상태에 발맞추어, 사용자의 부주의한 입력/클릭/메뉴 진입 등 레이스 컨디션을 유발할 수 있는 모든 UI 인터랙션 진입로를 일원화하여 방어(Guard)해주는 전역 제어 컴포저블 훅입니다.
 * @returns {{
 * isInteractionBlocked: import('vue').ComputedRef<boolean>,
 * isBlocked: () => boolean,
 * guard: (action: Function) => boolean
 * }} 인터랙션 가드 플래그 및 고차 실행 차단 핸들러 패키지
 */
export function useInteractionGuard() {
  // LLM의 실시간 토큰 생성 패킷 수신 플래그를 관측하기 위해 전역 스트림 스토어 인스턴스 마운트
  const chatStreamStore = useChatStreamStore();

  // [중요 상태 동기화]: AI가 답변을 출력 중인(isStreaming) 상태와 실시간 인터랙션 차단 상태를 단방향 1:1 매핑 연산(Computed) 처리
  const isInteractionBlocked = computed(() => chatStreamStore.isStreaming);

  /**
   * @description 현재 시점에 사용자의 기능 조작을 전면 거부/차단해야 하는지 여부를 논리값으로 즉시 판별하여 반환합니다.
   * @returns {boolean} 인터랙션 락(Lock) 활성화 여부
   */
  function isBlocked() {
    return isInteractionBlocked.value;
  }

  /**
   * @description [고차 가드 함수]: 인자로 받은 특정 콜백 함수(action)를 실행하기 직전, 스트리밍 상태를 체크하여 안전함이 검증되었을 때에만 집행을 위임 처리합니다.
   * @param {Function} action - 가드 통과 시 안전하게 실행하고자 하는 실질적인 비즈니스 로직 함수
   * @returns {boolean} 조작 집행의 최종 완수 성공 여부 (통과 시 true, 차단 시 false)
   */
  function guard(action) {
    // 멱등성 방어 가드: 현재 AI가 답변 중인 긴박한 시점이라면 함수 실행을 엄격히 취소 거부하고 실패 신호 반환
    if (isBlocked()) return false;

    // 안전 구역 확보 완료: 주입된 인자가 유효한 함수 형태가 맞다면 비로소 최종 격리 집행 실행
    if (typeof action === "function") action();
    return true; // 정상 실행 완수 신호 반환
  }

  // 중복 클릭 방지가 필요한 프롬프트 서브밋 단 및 네비게이션 드로어 조작 뷰 바인딩용 인터페이스 방출 반환
  return {
    isInteractionBlocked,
    isBlocked,
    guard,
  };
}
