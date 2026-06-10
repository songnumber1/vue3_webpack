/**
 * @file composables/main/useMainPageActions.js
 * @description 메인 화면 예시 프롬프트와 입력 영역 action을 담당합니다.
 */

export function useMainPageActions({promptInputRef, lock} = {}) {
  function applySuggestionToPrompt(item) {
    if (lock?.isPromptExampleBlocked?.value) return false;
    const prompt = item?.prompt || item?.title || item?.text || "";
    promptInputRef?.value?.setText?.(prompt, {focus: true});
    return true;
  }

  return {
    applySuggestionToPrompt,
  };
}
