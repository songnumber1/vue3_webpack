import {computed} from "vue";
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
 * @description 툴 목록 관리, 툴 선택 메뉴 열기/닫기, 설정형 툴 선택을 처리합니다.
 *              일반 툴은 입력창에 프롬프트를 주입하지 않고 메뉴만 닫습니다.
 * @param {object} options - props, toolMenuOpen ref, syncViewportMode 함수, toggleMenu 함수
 * @returns {object} 툴 관련 상태 및 핸들러
 */
export function usePromptTool({
  props,
  toolMenuOpen,
  syncViewportMode,
  toggleMenu,
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

      const isSwitchParent = tool.parentControlType === "switch";
      const isEnabledGroup =
        tool.settingGroup === "webSearch" && settings.webSearchEnabled;

      return {
        ...tool,
        label: t(tool.labelKey),
        active: isSwitchParent ? isEnabledGroup : activeCount > 0,
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
    if (tool?.settingGroup && tool?.parentControlType === "switch") {
      chatStore.setPromptToolGroupEnabled(tool.settingGroup, !tool.active);
      return;
    }

    if (tool?.settingGroup) {
      if (tool.settingGroup === "webSearch") {
        chatStore.setPromptToolGroupEnabled(tool.settingGroup, true);
      }

      chatStore.togglePromptToolOption(
        tool.settingGroup,
        tool.id,
        tool.selectionMode
      );
      return;
    }

    toolMenuOpen.value = false;
  }

  return {
    tools,
    openToolSelector,
    applyTool,
  };
}
