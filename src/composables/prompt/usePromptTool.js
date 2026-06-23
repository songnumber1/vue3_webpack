/**
 * @file composables/prompt/usePromptTool.js
 * @description Prompt Tool 메뉴 열기 동작만 담당합니다. Tool UI와 선택 상태는 PC/모바일 전용 컴포넌트와 promptControlStore가 직접 관리합니다.
 */

import {PROMPT_MENU_TYPE} from "@/constants/promptComposer";

export function usePromptTool({props, syncViewportMode, toggleMenu}) {
  function openToolSelector() {
    if (props.disabled || props.submitDisabled || props.hideToolActions) return;
    syncViewportMode();
    toggleMenu(PROMPT_MENU_TYPE.tool);
  }

  return {openToolSelector};
}
