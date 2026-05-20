import {ref} from "vue";

export function useChatScrollController({
  isConversationPage,
  workspaceRef,
  scrollToBottom,
  autoScrollEnabled = {value: true},
}) {
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
    return Boolean(autoScrollEnabled?.value) && Date.now() <= forceBottomUntil;
  }

  async function scrollBottom(options = {}) {
    if (options.autoAnswer && !autoScrollEnabled?.value) {
      updateScrollBottomButton();
      return;
    }
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
      Boolean(isConversationPage?.value) && Boolean(list && !list.isAtBottom?.());
  }

  function scheduleBottomStateCheck() {
    window.clearTimeout(bottomStateTimer);
    bottomStateTimer = window.setTimeout(updateScrollBottomButton, 80);
  }

  function handleMessageContentRendered() {
    if (shouldKeepForceBottom()) scrollBottom({force: true, stable: true, autoAnswer: true});
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
