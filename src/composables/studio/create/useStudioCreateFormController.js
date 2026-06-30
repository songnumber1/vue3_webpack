/**
 * @file composables/studio/create/useStudioCreateFormController.js
 * @description Studio 생성 화면 상태/action을 단계적으로 이동하기 위한 controller 기본 골격입니다.
 */
export function createEmptyStudioCreateFormController() {
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

export function useStudioCreateFormController(controller = {}) {
  return {
    ...createEmptyStudioCreateFormController(),
    ...controller,
  };
}
