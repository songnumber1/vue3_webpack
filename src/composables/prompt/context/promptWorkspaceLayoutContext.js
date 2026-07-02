/**
 * @file composables/prompt/context/promptWorkspaceLayoutContext.js
 * @description PromptComposer가 배치된 화면의 레이아웃 보정 action을 중간 emit 없이 호출하기 위한 context입니다.
 */
import {inject, provide, ref} from "vue";

export const PROMPT_WORKSPACE_LAYOUT_CONTEXT_KEY = Symbol(
  "PROMPT_WORKSPACE_LAYOUT_CONTEXT"
);

export function createEmptyPromptWorkspaceLayoutActions() {
  return {
    isExpanded: ref(false),
    onBlur: null,
    onExpandedChange: null,
    onHeightChange: null,
  };
}

export function providePromptWorkspaceLayoutActions(actions = {}) {
  provide(PROMPT_WORKSPACE_LAYOUT_CONTEXT_KEY, {
    ...createEmptyPromptWorkspaceLayoutActions(),
    ...actions,
  });
}

export function usePromptWorkspaceLayoutActions() {
  return inject(
    PROMPT_WORKSPACE_LAYOUT_CONTEXT_KEY,
    createEmptyPromptWorkspaceLayoutActions()
  );
}
