import {computed, nextTick} from "vue";
import {useI18n} from "vue-i18n";
import {useChatStore} from "@/stores/chatStore";
import {
  PROMPT_MENU_TYPE,
  PROMPT_TOOL_DEFINITIONS,
} from "@/constants/promptComposer";

function isToolOptionActive(settings, tool) {
  if (!tool?.settingGroup) return false;
  const value = settings?.[tool.settingGroup];
  return Array.isArray(value) ? value.includes(tool.id) : value === tool.id;
}

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
  const chatStore = useChatStore();

  const tools = computed(() => {
    const settings = chatStore.activePromptToolSettings;

    return PROMPT_TOOL_DEFINITIONS.map((tool) => {
      const children = Array.isArray(tool.children)
        ? tool.children.map((child) => ({
            ...child,
            label: t(child.labelKey),
            active: isToolOptionActive(settings, child),
            controlType: child.controlType || tool.childControlType || "",
          }))
        : undefined;
      const activeCount = children?.filter((child) => child.active).length || 0;

      return {
        ...tool,
        label: t(tool.labelKey),
        active: activeCount > 0,
        activeCount,
        parentControlType: tool.parentControlType || "",
        childControlType: tool.childControlType || "",
        children,
      };
    });
  });

  function openToolSelector() {
    if (props.disabled) return;
    syncViewportMode();
    toggleMenu(PROMPT_MENU_TYPE.tool);
  }

  function applyTool(tool) {
    if (tool?.settingGroup) {
      chatStore.togglePromptToolOption(
        tool.settingGroup,
        tool.id,
        tool.selectionMode
      );
      return;
    }

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
