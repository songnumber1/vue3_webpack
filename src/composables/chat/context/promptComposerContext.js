/**
 * @file composables/chat/context/promptComposerContext.js
 * @description PromptComposer 계열에서 중간 props/emit 전달 없이 상위 채팅 동작을 사용할 수 있도록 하는 좁은 범위의 context입니다.
 */
import {inject, provide} from "vue";

export const PROMPT_COMPOSER_CONTEXT_KEY = Symbol("PROMPT_COMPOSER_CONTEXT");

export function createEmptyPromptComposerContext() {
  return {
    onSubmit: null,
    onUpdateSelectedModel: null,
    onFocus: null,
    onHeightChange: null,
  };
}

export function providePromptComposerContext(context = {}) {
  provide(PROMPT_COMPOSER_CONTEXT_KEY, {
    ...createEmptyPromptComposerContext(),
    ...context,
  });
}

export function usePromptComposerContext() {
  return inject(PROMPT_COMPOSER_CONTEXT_KEY, null);
}
