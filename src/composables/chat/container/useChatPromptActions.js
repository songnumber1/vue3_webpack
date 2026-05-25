/**
 * @file composables/chat/container/useChatPromptActions.js
 * @description ChatContainer 전용 controller 계층입니다. route, UI 상태, scroll, modal, submit 흐름을 도메인별 composable로 조립합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export function useChatPromptActions({
  isReadOnly,
  isActiveModelUnavailable,
  refreshViewport,
}) {
  /**
   * Prompt focus/resize should only refresh viewport geometry.
   *
   * Scroll ownership:
   * - 질문 전송 시: useChatSubmit.scrollAfterUserSubmit()에서 마지막 사용자 질문 박스로 1회 이동
   * - 답변 수신 시: autoScrollOnAnswer=true일 때만 stream scroll
   *
   * 입력창 focus 또는 textarea resize에서 scrollBottom을 호출하면
   * 모바일 키보드 오픈/PC 모바일 사이즈에서 사용자가 의도하지 않았는데
   * 맨 아래로 이동하는 사이드 이펙트가 발생한다.
   */
  function refreshPromptViewport() {
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    refreshViewport?.();
  }

  return {
    refreshPromptViewport,
  };
}
