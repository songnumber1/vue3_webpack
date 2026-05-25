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
