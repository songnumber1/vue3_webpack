/**
 * @file composables/studio/context/studioCreateFormContext.js
 * @description Studio 생성 화면의 form 상태와 action을 하위 탭에서 직접 사용하기 위한 context입니다.
 */
import {inject, provide} from "vue";

export const STUDIO_CREATE_FORM_CONTEXT_KEY = Symbol(
  "STUDIO_CREATE_FORM_CONTEXT"
);

export function createEmptyStudioCreateFormContext() {
  return {
    createTab: null,
    draft: null,
    preview: null,
    previewInitial: null,
    previewPrompts: null,
    selectedCategoryLabel: null,
    categoryOptions: null,
    modelOptions: null,
    ragOptions: null,
    mcpOptions: null,
    selectedAuthorities: null,
    allAuthoritiesChecked: null,
    closeCreate: null,
    applyPreview: null,
    updateCreateTab: null,
    updateDraftField: null,
    updateDraftPrompt: null,
    openCategorySelector: null,
    toggleModel: null,
    updateRags: null,
    updateMcps: null,
    updateScope: null,
    openAuthorityPicker: null,
    deleteCheckedAuthorities: null,
    toggleAllAuthorities: null,
    toggleAuthority: null,
  };
}

export function provideStudioCreateForm(formContext = {}) {
  provide(STUDIO_CREATE_FORM_CONTEXT_KEY, {
    ...createEmptyStudioCreateFormContext(),
    ...formContext,
  });
}

export function useStudioCreateForm() {
  return inject(
    STUDIO_CREATE_FORM_CONTEXT_KEY,
    createEmptyStudioCreateFormContext()
  );
}
