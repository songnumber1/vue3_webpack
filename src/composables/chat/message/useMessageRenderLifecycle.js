/**
 * @file composables/chat/message/useMessageRenderLifecycle.js
 * @description MessageList 내부 렌더 lifecycle 이벤트를 context action으로 연결하는 얇은 컨트롤러입니다.
 */
export function useMessageRenderLifecycle(actions = {}) {
  function notifyMessageRendered(payload) {
    actions.messageRendered?.(payload);
  }

  function notifyMessageContentRendered() {
    actions.messageContentRendered?.();
  }

  function notifyHistoryRendered() {
    actions.historyRendered?.();
  }

  return {
    notifyMessageRendered,
    notifyMessageContentRendered,
    notifyHistoryRendered,
  };
}
