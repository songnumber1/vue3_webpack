import {computed, nextTick} from "vue";
import {useI18n} from "vue-i18n";
import {
  PROMPT_MENU_TYPE,
  PROMPT_TOOL_DEFINITIONS,
} from "@/constants/promptComposer";

/**
 * @description 툴 목록 관리, 툴 선택 메뉴 열기/닫기, 툴 프롬프트 적용을 처리합니다.
 * @param {object} options - props, toolMenuOpen ref, syncViewportMode 함수, closeMenus 함수,
 *                           text ref, resize 함수, focusTextarea 함수
 * @returns {object} 툴 관련 상태 및 핸들러
 */
export function usePromptTool({
  props,
  toolMenuOpen,
  syncViewportMode,
  toggleMenu,
  text,
  resize,
  focusTextarea,
}) {
  const {t} = useI18n();

  const tools = computed(() =>
    PROMPT_TOOL_DEFINITIONS.map((tool) => ({
      ...tool,
      label: t(tool.labelKey),
    }))
  );

  function openToolSelector() {
    if (props.disabled) return;
    syncViewportMode();
    toggleMenu(PROMPT_MENU_TYPE.tool);
  }

  function applyTool(tool) {
    text.value = text.value ? `${text.value}\n${tool.prompt}` : tool.prompt;
    toolMenuOpen.value = false;
    nextTick(() => {
      focusTextarea();
      resize();
    });
  }

  return {
    tools,
    openToolSelector,
    applyTool,
  };
}
