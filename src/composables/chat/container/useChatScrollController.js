import {nextTick, ref} from 'vue';
import {useAutoScroll} from '@/composables/useAutoScroll';

export function useChatScrollController({props, workspaceRef}) {
  const {scrollToBottom} = useAutoScroll({value: null});
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

  function resetForceBottom() {
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
      (props.mode === 'chat' || props.mode === 'shared') &&
      Boolean(list && !list.isAtBottom?.());
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
