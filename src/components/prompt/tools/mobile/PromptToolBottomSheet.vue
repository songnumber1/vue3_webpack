<template>
  <BaseBottomSheet
    :open="open"
    :title="resolvedToolTitle"
    :show-back="Boolean(activeToolGroupId)"
    :back-label="t('common.back')"
    @back="closeActiveToolGroup"
    @close="closeToolSheet"
  >
    <template v-if="!activeToolGroupId">
      <PromptTemplateSheetItem
        v-for="template in selectableTemplates"
        :key="template.id"
        :label="template.label"
        :description="template.description"
        :icon-src="template.iconSrc"
        :active="activePromptTemplateId === template.id"
        @select="selectPromptTemplate(template.id)"
      />

      <KnowledgeSearchSheetItem
        :label="t('chat.suggestions.knowledgeSearch')"
        :active="knowledgeActiveCount > 0"
        :active-count="knowledgeActiveCount"
        @open-group="openToolGroup(TOOL_GROUP.knowledge)"
      />

      <WebSearchSheetItem
        :label="t('chat.suggestions.webSearch')"
        :active="webSearchEnabled"
        @open-group="openToolGroup(TOOL_GROUP.web)"
        @toggle-enabled="toggleWebSearchEnabled"
      />
    </template>

    <KnowledgeSearchSheetOptions
      v-else-if="activeToolGroupId === TOOL_GROUP.knowledge"
      :paper-label="t('chat.suggestions.knowledge.paper')"
      :confluence-label="t('chat.suggestions.knowledge.confluence')"
      :jira-label="t('chat.suggestions.knowledge.jira')"
      :paper-active="isKnowledgeActive(KNOWLEDGE_OPTION.paper)"
      :confluence-active="isKnowledgeActive(KNOWLEDGE_OPTION.confluence)"
      :jira-active="isKnowledgeActive(KNOWLEDGE_OPTION.jira)"
      @toggle-option="toggleKnowledgeOption"
    />

    <WebSearchSheetOptions
      v-else-if="activeToolGroupId === TOOL_GROUP.web"
      :perplexity-label="t('chat.suggestions.web.perplexity')"
      :google-ai-overviews-label="t('chat.suggestions.web.googleAiOverviews')"
      :chatgpt-search-label="t('chat.suggestions.web.chatgptSearch')"
      :microsoft-copilot-label="t('chat.suggestions.web.microsoftCopilot')"
      :selected-engine="selectedWebSearchEngine"
      @select-engine="selectWebSearchEngine"
    />
  </BaseBottomSheet>
</template>

<script setup>
import {computed, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import {useChatStore} from "@/stores/chatStore";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {PROMPT_TEMPLATE_MODEL_IDS} from "@/constants/promptComposer";
import {resolvePromptTemplateToolIcon} from "@/constants/toolIcons";
import PromptTemplateSheetItem from "@/components/prompt/tools/mobile/PromptTemplateSheetItem.vue";
import KnowledgeSearchSheetItem from "@/components/prompt/tools/mobile/KnowledgeSearchSheetItem.vue";
import KnowledgeSearchSheetOptions from "@/components/prompt/tools/mobile/KnowledgeSearchSheetOptions.vue";
import WebSearchSheetItem from "@/components/prompt/tools/mobile/WebSearchSheetItem.vue";
import WebSearchSheetOptions from "@/components/prompt/tools/mobile/WebSearchSheetOptions.vue";

const TOOL_GROUP = Object.freeze({
  knowledge: "knowledge",
  web: "web",
});
const KNOWLEDGE_OPTION = Object.freeze({
  paper: "knowledge-paper",
  confluence: "knowledge-confluence",
  jira: "knowledge-jira",
});

const props = defineProps({
  open: {type: Boolean, default: false},
  title: {type: String, default: ""},
  modelValue: {type: String, default: ""},
});

const emit = defineEmits(["close"]);

const {t, locale} = useI18n();
const chatStore = useChatStore();
const promptControlStore = usePromptControlStore();
const {activePromptToolSettings} = storeToRefs(promptControlStore);

const activeToolGroupId = ref("");

const resolvedToolTitle = computed(() => props.title || t("chat.tools"));
const activePromptTemplateId = computed(
  () => activePromptToolSettings.value.promptTemplateId || ""
);
const knowledgeValues = computed(() =>
  Array.isArray(activePromptToolSettings.value.knowledgeSearch)
    ? activePromptToolSettings.value.knowledgeSearch
    : []
);
const knowledgeActiveCount = computed(() => knowledgeValues.value.length);
const webSearchEnabled = computed(() =>
  Boolean(activePromptToolSettings.value.webSearchEnabled)
);
const selectedWebSearchEngine = computed(
  () => activePromptToolSettings.value.webSearch || ""
);

const selectableTemplates = computed(() => {
  const modelId = props.modelValue || chatStore.selectedModelId || "";
  return chatStore.promptTemplates
    .filter((template) => isSelectableTemplate(template))
    .filter((template) => !template.modelId || template.modelId === modelId)
    .sort((a, b) => a.order - b.order)
    .map((template) => ({
      id: template.id,
      label: resolveTemplateLabel(template, locale.value),
      description: resolveTemplateDescription(template, locale.value),
      iconSrc: resolvePromptTemplateToolIcon(template.key),
    }));
});

function isSelectableTemplate(template = {}) {
  if (!template?.id || template.default) return false;
  if (!PROMPT_TEMPLATE_MODEL_IDS.includes(template.modelId)) return false;
  return ["mail", "translate", "summary", "code"].includes(template.key);
}

function resolveTemplateLabel(template = {}, currentLocale = "ko") {
  return currentLocale === "en"
    ? template.nameEn || template.nameKo
    : template.nameKo || template.nameEn;
}

function resolveTemplateDescription(template = {}, currentLocale = "ko") {
  return currentLocale === "en"
    ? template.descEn || template.descKo
    : template.descKo || template.descEn;
}

function isKnowledgeActive(optionId) {
  return knowledgeValues.value.includes(optionId);
}

function selectPromptTemplate(templateId) {
  promptControlStore.setActivePromptTemplate(templateId);
  emit("close");
}

function openToolGroup(groupId) {
  activeToolGroupId.value = activeToolGroupId.value === groupId ? "" : groupId;
}

function toggleWebSearchEnabled() {
  const willEnable = !webSearchEnabled.value;
  promptControlStore.setWebSearchEnabled(willEnable);
  activeToolGroupId.value = "";
  if (willEnable) activeToolGroupId.value = TOOL_GROUP.web;
}

function toggleKnowledgeOption(optionId) {
  promptControlStore.toggleKnowledgeSearchOption(optionId);
}

function selectWebSearchEngine(engineId) {
  promptControlStore.setWebSearchEnabled(true);
  promptControlStore.toggleWebSearchEngine(engineId);
}

function closeActiveToolGroup() {
  if (
    activeToolGroupId.value === TOOL_GROUP.web &&
    webSearchEnabled.value &&
    !selectedWebSearchEngine.value
  ) {
    promptControlStore.setWebSearchEnabled(false);
  }
  activeToolGroupId.value = "";
}

function closeToolSheet() {
  closeActiveToolGroup();
  emit("close");
}

watch(
  () => props.open,
  (open) => {
    if (!open) closeActiveToolGroup();
  }
);
</script>

<style scoped lang="scss">
:deep(.bottom-sheet-option-main) {
  min-width: 0;
}

:deep(.bottom-sheet-option--row > .bottom-sheet-option-main) {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
}

:deep(.bottom-sheet-option--row > .bottom-sheet-option-main strong),
:deep(.bottom-sheet-option--row > .bottom-sheet-option-main small) {
  width: 100%;
  text-align: left;
}

:deep(.bottom-sheet-submenu-arrow) {
  margin-left: auto;
  color: var(--muted);
  font-size: var(--font-size-lg);
  line-height: 1;
}

:deep(.bottom-sheet-active-badge) {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: auto !important;
  min-width: 28px !important;
  height: 28px;
  margin-left: auto;
  padding: 0 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
  font-size: var(--font-size-fixed-14) !important;
  font-weight: 800;
  line-height: 1;
}

:deep(.bottom-sheet-active-badge + .bottom-sheet-parent-switch),
:deep(.bottom-sheet-active-badge + .bottom-sheet-submenu-arrow) {
  margin-left: 8px;
}

:deep(.bottom-sheet-parent-switch) {
  appearance: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  position: relative;
  width: 38px !important;
  height: 22px;
  min-width: 38px !important;
  flex: 0 0 38px !important;
  margin-left: auto;
  border-radius: 999px;
  background: var(--control-border);
  transition: background 0.18s ease;
}

:deep(.bottom-sheet-parent-switch span) {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px !important;
  height: 16px;
  min-width: 16px !important;
  flex: 0 0 16px !important;
  border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
  transition: transform 0.18s ease;
}

:deep(.bottom-sheet-parent-switch.is-active) {
  background: var(--accent);
}

:deep(.bottom-sheet-parent-switch.is-active span) {
  transform: translateX(16px);
}

:deep(.bottom-sheet-parent-switch + .bottom-sheet-submenu-arrow) {
  margin-left: 6px;
}

:deep(.bottom-sheet-option--choice) {
  gap: 12px;
}

:deep(.bottom-sheet-option--choice strong) {
  flex: 1;
  min-width: 0;
}

:deep(.bottom-sheet-option--selectedRow.is-active) {
  border-color: var(--accent) !important;
  background: color-mix(in srgb, var(--accent) 24%, var(--surface)) !important;
  color: var(--text) !important;
  box-shadow:
    inset 4px 0 0 var(--accent),
    0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent) !important;
}

:deep(.bottom-sheet-option--selectedRow.is-active strong) {
  color: var(--text) !important;
  font-weight: 900;
}

:deep(.bottom-sheet-selected-check) {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
  flex: 0 0 24px !important;
  margin-left: auto;
  border-radius: 999px;
  background: var(--accent);
  color: var(--surface);
  font-size: var(--font-size-fixed-14);
  font-weight: 900;
  line-height: 1;
}

:deep(.bottom-sheet-checkbox) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 22px !important;
  height: 22px !important;
  min-width: 22px !important;
  flex: 0 0 22px !important;
  border: 1px solid var(--control-border) !important;
  border-radius: 5px !important;
  background: var(--surface) !important;
  color: transparent !important;
  font-size: 0 !important;
  font-weight: 800;
  line-height: 1 !important;
  box-shadow: none !important;
}

:deep(.bottom-sheet-option.is-active .bottom-sheet-checkbox),
:deep(.bottom-sheet-checkbox.is-checked) {
  border-color: var(--accent) !important;
  background: var(--accent) !important;
  color: var(--surface) !important;
}

:deep(.bottom-sheet-checkbox-mark) {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: auto !important;
  min-width: 0 !important;
  height: auto !important;
  flex: 0 0 auto !important;
  color: inherit !important;
  font-size: var(--text-size-body) !important;
  line-height: 1 !important;
}

:deep(.bottom-sheet-radio) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 22px !important;
  height: 22px !important;
  min-width: 22px !important;
  flex: 0 0 22px !important;
  border: 1px solid var(--control-border) !important;
  border-radius: 999px !important;
  background: var(--surface) !important;
}

:deep(.bottom-sheet-radio.is-selected) {
  border-color: var(--accent) !important;
  background: color-mix(in srgb, var(--accent) 12%, var(--surface)) !important;
}

:deep(.bottom-sheet-radio-dot) {
  display: block;
  width: 10px !important;
  height: 10px !important;
  min-width: 10px !important;
  border-radius: 999px;
  background: var(--accent);
}

:deep(.bottom-sheet-option--row > .bottom-sheet-active-badge),
:deep(.bottom-sheet-option--row > .bottom-sheet-parent-switch),
:deep(.bottom-sheet-option--row > .bottom-sheet-submenu-arrow),
:deep(.bottom-sheet-option--row > .bottom-sheet-checkbox),
:deep(.bottom-sheet-option--row > .bottom-sheet-radio) {
  box-sizing: border-box;
}

:deep(.bottom-sheet-option--row > .bottom-sheet-parent-switch) {
  width: 38px !important;
  min-width: 38px !important;
  height: 22px !important;
  flex: 0 0 38px !important;
}

:deep(.bottom-sheet-option--row > .bottom-sheet-parent-switch > span) {
  width: 16px !important;
  min-width: 16px !important;
  height: 16px !important;
  flex: 0 0 16px !important;
  text-align: initial;
  font-size: 0;
}

:deep(.bottom-sheet-option--row > .bottom-sheet-checkbox) {
  width: 22px !important;
  min-width: 22px !important;
  height: 22px !important;
  flex: 0 0 22px !important;
  text-align: center !important;
  font-size: var(--text-size-body) !important;
}

:deep(.bottom-sheet-option--row > .bottom-sheet-checkbox > span) {
  width: auto !important;
  min-width: 0 !important;
  height: auto !important;
  flex: 0 0 auto !important;
  text-align: center !important;
  font-size: var(--text-size-body) !important;
  line-height: 1 !important;
}

:deep(.bottom-sheet-option--template) {
  min-height: 54px;
  display: flex !important;
  justify-content: flex-start !important;
  align-items: center !important;
  gap: 10px !important;
  text-align: left !important;
  border: 0;
}

:deep(.bottom-sheet-option--template.is-active) {
  background: color-mix(in srgb, var(--accent) 12%, var(--control-hover));
}

:deep(.bottom-sheet-template-dot) {
  display: none;
}

:deep(.bottom-sheet-option--template > .bottom-sheet-option-main) {
  display: flex !important;
  width: auto !important;
  min-width: 0 !important;
  flex: 1 1 auto !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  justify-content: center !important;
  gap: 3px !important;
  text-align: left !important;
}

:deep(.bottom-sheet-option--template > .bottom-sheet-option-main strong),
:deep(.bottom-sheet-option--template > .bottom-sheet-option-main small) {
  width: 100% !important;
  text-align: left !important;
}

:deep(.bottom-sheet-option--template .bottom-sheet-option-main small) {
  color: var(--muted);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.2;
}

:global(body.mobile-mode)
  :deep(.bottom-sheet-option--template > .bottom-sheet-option-main) {
  width: auto !important;
  min-width: 0 !important;
  flex: 1 1 auto !important;
  text-align: left !important;
}

:deep(.bottom-sheet-tool-icon) {
  width: 22px !important;
  min-width: 22px !important;
  height: 22px !important;
  flex: 0 0 22px !important;
  object-fit: contain;
}
</style>
