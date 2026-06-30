/**
 * @file composables/prompt/context/promptInputStateContext.js
 * @description PromptInputMobile 하위 컴포넌트가 공유하는 입력 영역 상태를 props 전달 없이 사용하기 위한 context입니다.
 */
import {inject, provide} from "vue";

export const PROMPT_INPUT_STATE_CONTEXT_KEY = Symbol(
  "PROMPT_INPUT_STATE_CONTEXT"
);

export function createEmptyPromptInputState() {
  return {
    attachments: [],
    selectedTemplateGroups: [],
    activeMobileGroup: null,
    hasSelectedTemplatePanel: false,
    isPromptExpanded: false,
    promptExpandToggleLabel: "",
  };
}

export function providePromptInputState(state = {}) {
  provide(PROMPT_INPUT_STATE_CONTEXT_KEY, {
    ...createEmptyPromptInputState(),
    ...state,
  });
}

export function usePromptInputState() {
  return inject(PROMPT_INPUT_STATE_CONTEXT_KEY, createEmptyPromptInputState());
}
