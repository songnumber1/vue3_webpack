export function useChatPromptActions({
  isMainPage,
  isReadOnly,
  isActiveModelUnavailable,
  isMobile,
  refreshViewport,
  scrollBottom,
}) {
  function scrollAfterPromptInteraction({refresh = false} = {}) {
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    if (refresh) refreshViewport();
    if (isMainPage.value) return;
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
