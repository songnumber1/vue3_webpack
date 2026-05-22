import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useChatStore} from "@/stores/chatStore";
import {useAssistantStore} from "@/stores/assistantStore";
import {
  PROMPT_MENU_TYPE,
  PROMPT_TOOL_DEFINITIONS,
  PROMPT_TEMPLATE_MODEL_IDS,
} from "@/constants/promptComposer";

function isToolOptionActive(settings, tool) {
  if (tool?.promptTemplateKey) return settings?.promptTemplateId === tool.id;
  if (!tool?.settingGroup) return false;
  const value = settings?.[tool.settingGroup];
  return Array.isArray(value) ? value.includes(tool.id) : value === tool.id;
}

function resolveTemplateLabel(template = {}, locale = "ko") {
  return locale === "en" ? template.nameEn || template.nameKo : template.nameKo || template.nameEn;
}

function resolveTemplateDescription(template = {}, locale = "ko") {
  return locale === "en" ? template.descEn || template.descKo : template.descKo || template.descEn;
}

function isSelectableTemplate(template = {}) {
  if (!template?.id || template.default) return false;
  if (!PROMPT_TEMPLATE_MODEL_IDS.includes(template.modelId)) return false;
  return ["mail", "translate", "summary", "code"].includes(template.key);
}

/**
 * @description 툴 목록 관리, 툴 선택 메뉴 열기/닫기, 설정형 툴 선택을 처리합니다.
 *              프롬프트 템플릿은 현재 모델에 연결된 API/mock 응답만 도구 메뉴에 표시합니다.
 * @param {object} options - props, toolMenuOpen ref, syncViewportMode 함수, toggleMenu 함수
 * @returns {object} 툴 관련 상태 및 핸들러
 */
export function usePromptTool({
  props,
  toolMenuOpen,
  syncViewportMode,
  toggleMenu,
}) {
  const {t, locale} = useI18n();
  const chatStore = useChatStore();
  const assistantStore = useAssistantStore();

  const settingToolDefinitions = PROMPT_TOOL_DEFINITIONS.filter(
    (tool) => !tool.promptTemplateKey
  );

  const tools = computed(() => {
    const settings = chatStore.activePromptToolSettings;
    const modelId = props.modelValue || assistantStore.selectedModelId || "";

    const templateTools = assistantStore.promptTemplates
      .filter((template) => isSelectableTemplate(template))
      .filter((template) => !template.modelId || template.modelId === modelId)
      .sort((a, b) => a.order - b.order)
      .map((template) => ({
        id: template.id,
        icon: "",
        label: resolveTemplateLabel(template, locale.value),
        description: resolveTemplateDescription(template, locale.value),
        promptTemplateKey: template.key,
        active: settings.promptTemplateId === template.id,
        activeCount: 0,
      }));

    const settingTools = settingToolDefinitions.map((tool) => {
      const children = Array.isArray(tool.children)
        ? tool.children.map((child) => ({
            ...child,
            label: t(child.labelKey),
            description: child.descriptionKey ? t(child.descriptionKey) : "",
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
        description: tool.descriptionKey ? t(tool.descriptionKey) : "",
        active: isSwitchParent ? isEnabledGroup : activeCount > 0,
        activeCount,
        parentControlType: tool.parentControlType || "",
        childControlType: tool.childControlType || "",
        children,
      };
    });

    return [...templateTools, ...settingTools];
  });

  function openToolSelector() {
    if (props.disabled) return;
    syncViewportMode();
    toggleMenu(PROMPT_MENU_TYPE.tool);
  }

  function applyTool(tool) {
    if (tool?.promptTemplateKey) {
      chatStore.setActivePromptTemplate(tool.id);
      toolMenuOpen.value = false;
      return;
    }

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
