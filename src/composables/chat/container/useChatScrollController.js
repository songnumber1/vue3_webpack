import {nextTick, ref} from 'vue';
import {useAutoScroll} from '@/composables/useAutoScroll';
import {createForceBottomWindow, shouldShowScrollBottomButton} from '@/services/chatScroll/stickyBottomScroll';

export function useChatScrollController({props, workspaceRef}) {
  const {scrollToBottom} = useAutoScroll({value: null});
  const showScrollBottom = ref(false);
  let bottomStateTimer = 0;
  const forceBottom = createForceBottomWindow();

  function getMessageListRef() {
    const exposed = workspaceRef.value?.listRef;
    if (exposed?.scrollToBottom) return exposed;
    if (exposed?.value?.scrollToBottom) return exposed.value;
    return null;
  }

  function markForceBottom(duration = 1800) {
    forceBottom.mark(duration);
  }

  function resetForceBottom() {
    forceBottom.reset();
  }

  function shouldKeepForceBottom() {
    return forceBottom.active();
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
    showScrollBottom.value = shouldShowScrollBottomButton({
    mode: props.mode,
    listRef: list,
  });
  }

  function scheduleBottomStateCheck() {
    window.clearTimeout(bottomStateTimer);
    bottomStateTimer = window.setTimeout(updateScrollBottomButton, 80);
  }

  async function scrollToRouteBottom() {
    markForceBottom();
    await nextTick();
    await scrollBottom({behavior: 'auto', force: true, stable: true});
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
    resetForceBottom,
    scrollBottom,
    scrollToRouteBottom,
    scheduleBottomStateCheck,
    handleMessageContentRendered,
    cleanupScrollController,
  };
}
