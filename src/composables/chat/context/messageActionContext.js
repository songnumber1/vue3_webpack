/**
 * @file composables/chat/context/messageActionContext.js
 * @description 메시지 action과 렌더 lifecycle을 중간 emit 전달 없이 연결하기 위한 context입니다.
 */
import {inject, provide} from "vue";

export const MESSAGE_ACTION_CONTEXT_KEY = Symbol("MESSAGE_ACTION_CONTEXT");

export function createEmptyMessageActions() {
  return {
    regenerate: null,
    messageRendered: null,
    messageContentRendered: null,
    historyRendered: null,
  };
}

export function provideMessageActions(actions = {}) {
  provide(MESSAGE_ACTION_CONTEXT_KEY, {
    ...createEmptyMessageActions(),
    ...actions,
  });
}

export function useMessageActions() {
  return inject(MESSAGE_ACTION_CONTEXT_KEY, createEmptyMessageActions());
}
