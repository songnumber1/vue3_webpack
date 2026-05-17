/**
 * @description Prompt focus/resize 시 viewport와 메시지 하단 위치를 동기화합니다.
 * @param {*} options - 입력 viewport 처리에 필요한 의존성입니다.
 * @returns {{handlePromptFocus: Function, handlePromptResize: Function}} prompt 이벤트 핸들러입니다.
 */
export function useChatInputViewport({props, isReadOnly, isActiveModelUnavailable, isMobile, refreshViewport, scrollBottom}) {
  function syncPromptViewport({refresh = false} = {}) {
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    if (refresh) refreshViewport();
    if (props.mode === 'main') return;
    scrollBottom({stable: true, force: isMobile.value});
  }

  function handlePromptFocus() {
    syncPromptViewport({refresh: true});
  }

  function handlePromptResize() {
    syncPromptViewport();
  }

  return {handlePromptFocus, handlePromptResize};
}
