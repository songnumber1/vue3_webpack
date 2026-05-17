import {ref} from "vue";

export function useChatScrollController({props, workspaceRef, scrollToBottom}) {
  const showScrollBottom = ref(false);
  let bottomStateTimer = 0;
  let forceBottomUntil = 0;

  function getMessageListRef() {
    const exposed = workspaceRef.value?.listRef;
    if (exposed?.scrollToBottom) return exposed;
    if (exposed?.value?.scrollToBottom) return exposed.value;
    return null;
  }

  function markForceBottom(duration = 1800) {
    forceBottomUntil = Date.now() + duration;
  }

  function clearForceBottom() {
    forceBottomUntil = 0;
  }

  function shouldKeepForceBottom() {
    return Date.now() <= forceBottomUntil;
  }

  async function scrollBottom(options = {}) {
    const list = getMessageListRef();
    if (list?.scrollToBottom) {
      list.scrollToBottom(options);
    } else {
      await scrollToBottom(options);
    }
    updateScrollBottomButton();
  }

  function updateScrollBottomButton() {
    const list = getMessageListRef();
    showScrollBottom.value =
      (props.mode === "chat" || props.mode === "shared") &&
      Boolean(list && !list.isAtBottom?.());
  }

  function scheduleBottomStateCheck() {
    window.clearTimeout(bottomStateTimer);
    bottomStateTimer = window.setTimeout(updateScrollBottomButton, 80);
  }

  function handleMessageContentRendered() {
    if (shouldKeepForceBottom()) scrollBottom({force: true, stable: true});
    scheduleBottomStateCheck();
  }

  function cleanupScrollController() {
    window.clearTimeout(bottomStateTimer);
  }

  return {
    showScrollBottom,
    markForceBottom,
    clearForceBottom,
    scrollBottom,
    scheduleBottomStateCheck,
    handleMessageContentRendered,
    cleanupScrollController,
  };
}
