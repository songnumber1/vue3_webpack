/**
 * @file composables/prompt/context/promptInputActionContext.js
 * @description PromptComposer 내부 입력/툴바/첨부/템플릿 action을 하위 컴포넌트에서 직접 사용할 수 있도록 하는 context입니다.
 */
import {inject, provide} from "vue";

export const PROMPT_INPUT_ACTION_CONTEXT_KEY = Symbol(
  "PROMPT_INPUT_ACTION_CONTEXT"
);

export function createEmptyPromptInputActions() {
  return {
    previewImage: null,
    removeAttachment: null,
    markPreviewError: null,
    addFiles: null,
    selectTemplateOption: null,
    openTemplateOptionSheet: null,
    closeTemplateOptionSheet: null,
    openMobileGroup: null,
    closeMobileGroup: null,
    openModelSelector: null,
    openToolSelector: null,
    selectModel: null,
    focus: null,
    blur: null,
    input: null,
    submit: null,
    paste: null,
    startVoiceInput: null,
    stopVoiceInput: null,
    togglePromptExpanded: null,
  };
}

export function providePromptInputActions(actions = {}) {
  provide(PROMPT_INPUT_ACTION_CONTEXT_KEY, {
    ...createEmptyPromptInputActions(),
    ...actions,
  });
}

export function usePromptInputActions() {
  return inject(
    PROMPT_INPUT_ACTION_CONTEXT_KEY,
    createEmptyPromptInputActions()
  );
}
