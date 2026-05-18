export function useChatPromptActions({
  props,
  isReadOnly,
  isActiveModelUnavailable,
  isMobile,
  refreshViewport,
  scrollBottom,
}) {
  function scrollAfterPromptInteraction({refresh = false} = {}) {
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    if (refresh) refreshViewport();
    if (props.mode === "main") return;
    scrollBottom({stable: true, force: isMobile.value});
  }

  function handlePromptFocus() {
    scrollAfterPromptInteraction({refresh: true});
  }

  function handlePromptResize() {
    scrollAfterPromptInteraction();
  }

  return {
    handlePromptFocus,
    handlePromptResize,
  };
}
