import {nextTick, ref} from 'vue';
import {useAutoScroll} from '@/composables/useAutoScroll';
import {renderMermaidInElement} from '@/utils/mermaidRenderer';

/**
 * @description 메시지 리스트 스크롤, 하단 버튼 상태, 스트림 렌더 후 보정 로직을 관리합니다.
 * @param {{mode: string}} props - ChatContainer props입니다.
 * @param {*} workspaceRef - ChatWorkspace expose ref입니다.
 * @returns {*} 스크롤 상태와 액션입니다.
 */
export function useChatScrollController(props, workspaceRef) {
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

  function handleMessageContentRendered() {
    if (shouldKeepForceBottom()) scrollBottom({force: true, stable: true});
    scheduleBottomStateCheck();
  }

  async function renderAfterStream() {
    markForceBottom(1000);
    await renderMermaidInElement(document.querySelector('.message-list'), {
      force: true,
    });
    scrollBottom({force: true, stable: true});
  }

  async function scrollRouteToBottom() {
    markForceBottom();
    await nextTick();
    await scrollBottom({behavior: 'auto', force: true, stable: true});
  }

  function cleanupScrollController() {
    window.clearTimeout(bottomStateTimer);
  }

  return {
    showScrollBottom,
    markForceBottom,
    resetForceBottom,
    scrollBottom,
    updateScrollBottomButton,
    scheduleBottomStateCheck,
    handleMessageContentRendered,
    renderAfterStream,
    scrollRouteToBottom,
    cleanupScrollController,
  };
}
