import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useAssistantStore} from "@/stores/assistantStore";
import {useChatStore} from "@/stores/chatStore";
import {PROMPT_TEMPLATE_MODEL_IDS} from "@/constants/promptComposer";

function hasTemplateFields(template = {}) {
  return Object.keys(template || {}).length > 0;
}

function resolveLocaleValue(value = {}, locale = "ko") {
  if (!value || typeof value !== "object") return "";
  return value[locale] || value.ko || value.en || "";
}

function isSelectableTemplate(template = {}) {
  if (!template?.id || template.default) return false;
  if (!PROMPT_TEMPLATE_MODEL_IDS.includes(template.modelId)) return false;
  return ["mail", "translate", "summary", "code"].includes(template.key);
}

export function usePromptTemplate({modelId} = {}) {
  const {locale} = useI18n();
  const assistantStore = useAssistantStore();
  const chatStore = useChatStore();
  const activeMobileGroupId = ref("");

  const activeSettings = computed(() => chatStore.activePromptToolSettings);

  const currentModelTemplates = computed(() => {
    const selectedModelId = modelId?.value || assistantStore.selectedModelId || "";

    return assistantStore.promptTemplates
      .filter((template) => isSelectableTemplate(template))
      .filter((template) => !template.modelId || template.modelId === selectedModelId)
      .sort((a, b) => a.order - b.order);
  });

  const selectedTemplate = computed(() => {
    const selectedId = activeSettings.value.promptTemplateId;
    if (!selectedId) return null;

    return (
      currentModelTemplates.value.find((template) => template.id === selectedId) ||
      null
    );
  });

  const selectedTemplateOptions = computed(() => {
    return activeSettings.value.promptTemplateOptions || {};
  });

  const selectedTemplateGroups = computed(() => {
    const template = selectedTemplate.value?.template || {};
    return Object.entries(template)
      .map(([groupId, group]) => {
        const options = Array.isArray(group.content)
          ? group.content.map((option) => ({
              tag: option.tag || option.ko || option.en || "",
              label: resolveLocaleValue(option, locale.value),
            }))
          : [];
        const selectedTag = selectedTemplateOptions.value[groupId] || options[0]?.tag || "";
        const selectedOption =
          options.find((option) => option.tag === selectedTag) || options[0] || null;

        return {
          id: groupId,
          label: resolveLocaleValue(group, locale.value),
          type: group.type || "radio",
          options,
          selectedTag,
          selectedLabel: selectedOption?.label || "",
        };
      })
      .filter((group) => group.label && group.options.length > 0);
  });

  const activeMobileGroup = computed(() => {
    return (
      selectedTemplateGroups.value.find(
        (group) => group.id === activeMobileGroupId.value
      ) || null
    );
  });

  const hasSelectedTemplatePanel = computed(() => {
    return Boolean(
      selectedTemplate.value &&
        hasTemplateFields(selectedTemplate.value.template) &&
        selectedTemplateGroups.value.length > 0
    );
  });

  function isTemplateOptionActive(group, option) {
    return (group.selectedTag || group.options[0]?.tag) === option.tag;
  }

  function selectTemplateOption(groupId, optionTag) {
    chatStore.setPromptTemplateOption(groupId, optionTag);
    activeMobileGroupId.value = "";
  }

  function openTemplateOptionSheet(groupId) {
    activeMobileGroupId.value = groupId;
  }

  function closeTemplateOptionSheet() {
    activeMobileGroupId.value = "";
  }

  return {
    selectedTemplate,
    selectedTemplateGroups,
    hasSelectedTemplatePanel,
    activeMobileGroup,
    isTemplateOptionActive,
    selectTemplateOption,
    openTemplateOptionSheet,
    closeTemplateOptionSheet,
  };
}
