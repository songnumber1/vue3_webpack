/**
 * @file composables/chat/conversation/useChatConversationActions.js
 * @description 채팅 대화 화면의 workspace action을 화면 정책에 맞게 감싸서 제공합니다.
 */

export function useChatConversationActions({workspaceActions, lock} = {}) {
  function scrollBottom(options = {}) {
    if (lock?.isScrollButtonBlocked?.value) return false;
    workspaceActions?.scrollBottom?.(options);
    return true;
  }

  function regenerate(message) {
    if (lock?.isRegenerateBlocked?.value) return false;
    workspaceActions?.regenerate?.(message);
    return true;
  }

  function loadPreviousHistoryMessages() {
    if (lock?.isLoadPreviousBlocked?.value) return false;
    return workspaceActions?.loadPreviousHistoryMessages?.() ?? false;
  }

  function handleMessageContentRendered() {
    workspaceActions?.handleMessageContentRendered?.();
  }

  function handleHistoryRendered() {
    workspaceActions?.handleHistoryRendered?.();
  }

  return {
    scrollBottom,
    regenerate,
    loadPreviousHistoryMessages,
    handleMessageContentRendered,
    handleHistoryRendered,
  };
}
