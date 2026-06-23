<template>
  <div
    v-if="open"
    ref="toolMenuRef"
    class="prompt-popover prompt-tool-menu prompt-floating-menu tw-box-border tw-rounded-control tw-border tw-border-solid tw-border-app-border tw-bg-app-menu tw-shadow-menu"
    :style="toolMenuStyle"
  >
    <PromptTemplateFloatItem
      v-for="template in selectableTemplates"
      :key="template.id"
      :label="template.label"
      :icon-src="template.iconSrc"
      :active="activePromptTemplateId === template.id"
      @select="selectPromptTemplate(template.id)"
    />

    <KnowledgeSearchFloatItem
      :label="t('chat.suggestions.knowledgeSearch')"
      :active="knowledgeActiveCount > 0"
      :active-count="knowledgeActiveCount"
      :expanded="activeToolGroupId === TOOL_GROUP.knowledge"
      @toggle-group="toggleToolGroup(TOOL_GROUP.knowledge)"
    />

    <WebSearchFloatItem
      :label="t('chat.suggestions.webSearch')"
      :active="webSearchEnabled"
      :expanded="activeToolGroupId === TOOL_GROUP.web"
      @toggle-group="toggleToolGroup(TOOL_GROUP.web)"
      @toggle-enabled="toggleWebSearchEnabled"
    />

    <div
      v-if="activeToolGroupId"
      class="prompt-popover prompt-tool-submenu tw-box-border tw-rounded-control tw-border tw-border-solid tw-border-app-border tw-bg-app-menu tw-shadow-menu"
      :class="`prompt-tool-submenu--${submenuPlacement}`"
      role="menu"
    >
      <KnowledgeSearchFloatSubmenu
        v-if="activeToolGroupId === TOOL_GROUP.knowledge"
        :paper-label="t('chat.suggestions.knowledge.paper')"
        :confluence-label="t('chat.suggestions.knowledge.confluence')"
        :jira-label="t('chat.suggestions.knowledge.jira')"
        :paper-active="isKnowledgeActive(KNOWLEDGE_OPTION.paper)"
        :confluence-active="isKnowledgeActive(KNOWLEDGE_OPTION.confluence)"
        :jira-active="isKnowledgeActive(KNOWLEDGE_OPTION.jira)"
        @toggle-option="toggleKnowledgeOption"
      />
      <WebSearchFloatSubmenu
        v-else-if="activeToolGroupId === TOOL_GROUP.web"
        :perplexity-label="t('chat.suggestions.web.perplexity')"
        :google-ai-overviews-label="t('chat.suggestions.web.googleAiOverviews')"
        :chatgpt-search-label="t('chat.suggestions.web.chatgptSearch')"
        :microsoft-copilot-label="t('chat.suggestions.web.microsoftCopilot')"
        :selected-engine="selectedWebSearchEngine"
        @select-engine="selectWebSearchEngine"
      />
    </div>
  </div>
</template>

<script setup>
import {computed, nextTick, ref, watch} from "vue";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";
import {storeToRefs} from "pinia";
import {useI18n} from "vue-i18n";
import {useAssistantStore} from "@/stores/assistantStore";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {PROMPT_TEMPLATE_MODEL_IDS} from "@/constants/promptComposer";
import {resolvePromptTemplateToolIcon} from "@/constants/toolIcons";
import PromptTemplateFloatItem from "@/components/prompt/tools/desktop/PromptTemplateFloatItem.vue";
import KnowledgeSearchFloatItem from "@/components/prompt/tools/desktop/KnowledgeSearchFloatItem.vue";
import WebSearchFloatItem from "@/components/prompt/tools/desktop/WebSearchFloatItem.vue";
import KnowledgeSearchFloatSubmenu from "@/components/prompt/tools/desktop/KnowledgeSearchFloatSubmenu.vue";
import WebSearchFloatSubmenu from "@/components/prompt/tools/desktop/WebSearchFloatSubmenu.vue";

const TOOL_MENU_FLOATING_OFFSET = 10;
const TOOL_MENU_FLOATING_PADDING = 12;
const TOOL_SUBMENU_WIDTH = 248;
const TOOL_GROUP = Object.freeze({
  knowledge: "knowledge",
  web: "web",
});
const KNOWLEDGE_OPTION = Object.freeze({
  paper: "knowledge-paper",
  confluence: "knowledge-confluence",
  jira: "knowledge-jira",
});
const TOOL_SUBMENU_PLACEMENT = Object.freeze({
  LEFT: "left",
  RIGHT: "right",
});

const props = defineProps({
  open: {type: Boolean, default: false},
  referenceElement: {type: Object, default: null},
  modelValue: {type: String, default: ""},
  isMobileSheet: {type: Boolean, default: false},
});

const emit = defineEmits(["close"]);

const {t, locale} = useI18n();
const assistantStore = useAssistantStore();
const promptControlStore = usePromptControlStore();
const {activePromptToolSettings} = storeToRefs(promptControlStore);

const toolMenuRef = ref(null);
const toolPositionReady = ref(false);
const activeToolGroupId = ref("");
const submenuPlacement = ref(TOOL_SUBMENU_PLACEMENT.RIGHT);

const toolReferenceRef = computed(() => props.referenceElement || null);
const {floatingStyles: toolFloatingStyles, update: updateToolFloating} =
  useFloating(toolReferenceRef, toolMenuRef, {
    placement: "top-start",
    strategy: "absolute",
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(TOOL_MENU_FLOATING_OFFSET),
      flip({fallbackPlacements: ["top-end", "bottom-start", "bottom-end"]}),
      shift({padding: TOOL_MENU_FLOATING_PADDING}),
    ],
  });

const toolMenuStyle = computed(() => ({
  ...toolFloatingStyles.value,
  visibility: toolPositionReady.value ? "visible" : "hidden",
}));

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
  const modelId = props.modelValue || assistantStore.selectedModelId || "";
  return assistantStore.promptTemplates
    .filter((template) => isSelectableTemplate(template))
    .filter((template) => !template.modelId || template.modelId === modelId)
    .sort((a, b) => a.order - b.order)
    .map((template) => ({
      id: template.id,
      label: resolveTemplateLabel(template, locale.value),
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

function isKnowledgeActive(optionId) {
  return knowledgeValues.value.includes(optionId);
}

function selectPromptTemplate(templateId) {
  promptControlStore.setActivePromptTemplate(templateId);
  emit("close");
}

async function toggleToolGroup(groupId) {
  if (activeToolGroupId.value === groupId) {
    closeActiveToolGroup();
    return;
  }

  activeToolGroupId.value = groupId;
  await nextTick();
  await updateToolFloating?.();
  resolveSubmenuPlacement();
}

async function toggleWebSearchEnabled() {
  const willEnable = !webSearchEnabled.value;
  promptControlStore.setWebSearchEnabled(willEnable);
  activeToolGroupId.value = "";
  if (willEnable) await toggleToolGroup(TOOL_GROUP.web);
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

function resolveSubmenuPlacement() {
  const menuRect = toolMenuRef.value?.getBoundingClientRect?.();
  if (!menuRect) {
    submenuPlacement.value = TOOL_SUBMENU_PLACEMENT.RIGHT;
    return;
  }

  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  const rightSpace = viewportWidth - menuRect.right;
  const leftSpace = menuRect.left;
  submenuPlacement.value =
    rightSpace >= TOOL_SUBMENU_WIDTH || rightSpace >= leftSpace
      ? TOOL_SUBMENU_PLACEMENT.RIGHT
      : TOOL_SUBMENU_PLACEMENT.LEFT;
}

watch(
  () => props.open,
  async (open) => {
    toolPositionReady.value = false;
    if (!open) {
      closeActiveToolGroup();
      return;
    }

    await nextTick();
    await updateToolFloating?.();
    toolPositionReady.value = true;
  },
  {flush: "post"}
);

watch(
  () => props.isMobileSheet,
  () => {
    closeActiveToolGroup();
  }
);
</script>

<style scoped lang="scss">
.prompt-popover {
  box-sizing: border-box;
}

.prompt-floating-menu {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  z-index: var(--z-popover);
}

.prompt-tool-menu-parent {
  position: relative;
}

.prompt-tool-menu-parent.active {
  background: var(--control-hover);
}

.prompt-submenu-arrow {
  margin-left: auto;
  width: auto;
  color: var(--muted);
  font-size: var(--font-size-lg);
  line-height: 1;
}

.prompt-tool-submenu {
  top: 0;
  bottom: auto;
  min-width: 220px;
}

.prompt-tool-submenu--right {
  left: calc(100% + 8px);
  right: auto;
}

.prompt-tool-submenu--left {
  right: calc(100% + 8px);
  left: auto;
}

.prompt-menu-active-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  margin-left: auto;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.prompt-menu-active-badge + .prompt-submenu-arrow,
.prompt-tool-parent-switch + .prompt-submenu-arrow {
  margin-left: 6px;
}

.prompt-tool-parent-switch {
  appearance: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  position: relative;
  width: 34px;
  height: 20px;
  min-width: 34px;
  margin-left: auto;
  border-radius: 999px;
  background: var(--control-border);
  transition: background 0.18s ease;
}

.prompt-tool-parent-switch span {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.16);
  transition: transform 0.18s ease;
}

.prompt-tool-parent-switch.is-active {
  background: var(--accent);
}

.prompt-tool-parent-switch.is-active span {
  transform: translateX(14px);
}

.prompt-tool-parent-switch > span {
  min-width: 14px;
  flex: 0 0 14px;
  text-align: initial;
  font-size: 0;
}

.prompt-tool-child-option {
  gap: 12px;
  min-height: 44px;
}

.prompt-tool-child-option p {
  flex: 1;
  min-width: 0;
}

.prompt-tool-child-option--selectedRow.is-active {
  border-color: var(--accent) !important;
  background: color-mix(in srgb, var(--accent) 24%, var(--surface)) !important;
  color: var(--text) !important;
  box-shadow:
    inset 4px 0 0 var(--accent),
    0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent) !important;
}

.prompt-tool-child-option--selectedRow.is-active p {
  color: var(--text) !important;
  font-weight: 900;
}

.prompt-tool-selected-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  min-width: 22px;
  flex: 0 0 22px;
  margin-left: auto;
  border-radius: 999px;
  background: var(--accent);
  color: var(--surface);
  font-size: var(--font-size-fixed-14);
  font-weight: 900;
  line-height: 1;
}

.prompt-tool-radio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  min-width: 18px;
  flex: 0 0 18px;
  border: 1px solid var(--control-border);
  border-radius: 999px;
  background: var(--surface);
}

.prompt-tool-radio.is-selected {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
}

.prompt-tool-radio > span {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--accent);
}

.prompt-tool-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  min-width: 18px;
  border: 1px solid var(--control-border);
  border-radius: 5px;
  background: var(--surface);
  color: var(--surface);
  font-size: var(--font-size-fixed-12);
  font-weight: 800;
  line-height: 1;
}

.prompt-tool-child-option.is-active .prompt-tool-checkbox {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--surface);
}

.prompt-tool-menu button.is-template-tool {
  min-height: 38px;
  padding: 7px 10px;
  border: 0;
  border-radius: 5px;
}

.prompt-tool-menu button.is-template-tool + button.is-template-tool {
  margin-top: 4px;
}

.prompt-tool-menu button.is-template-tool.active {
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
  color: var(--text);
  box-shadow: none;
}

.prompt-tool-icon {
  width: 24px !important;
  text-align: center;
}

.prompt-tool-text {
  display: flex;
  width: auto !important;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.prompt-tool-menu button.is-template-tool .prompt-tool-text small {
  display: none;
}

.prompt-tool-text strong,
.prompt-tool-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-tool-text strong {
  font-size: var(--font-size-md);
  font-weight: 900;
  line-height: 1.2;
}

.prompt-tool-text small {
  color: var(--muted);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.2;
}

.prompt-tool-icon-img {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  object-fit: contain;
}

:deep(.prompt-submenu-arrow) {
  margin-left: auto;
  width: auto;
  color: var(--muted);
  font-size: var(--font-size-lg);
  line-height: 1;
}

:deep(.prompt-menu-active-badge) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  margin-left: auto;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

:deep(.prompt-menu-active-badge + .prompt-submenu-arrow),
:deep(.prompt-tool-parent-switch + .prompt-submenu-arrow) {
  margin-left: 6px;
}

:deep(.prompt-tool-parent-switch) {
  appearance: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  position: relative;
  width: 34px;
  height: 20px;
  min-width: 34px;
  margin-left: auto;
  border-radius: 999px;
  background: var(--control-border);
  transition: background 0.18s ease;
}

:deep(.prompt-tool-parent-switch span) {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  min-width: 14px;
  flex: 0 0 14px;
  border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.16);
  text-align: initial;
  font-size: 0;
  transition: transform 0.18s ease;
}

:deep(.prompt-tool-parent-switch.is-active) {
  background: var(--accent);
}

:deep(.prompt-tool-parent-switch.is-active span) {
  transform: translateX(14px);
}

:deep(.prompt-tool-child-option p) {
  flex: 1;
  min-width: 0;
}

:deep(.prompt-tool-checkbox) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  min-width: 18px;
  border: 1px solid var(--control-border);
  border-radius: 5px;
  background: var(--surface);
  color: var(--surface);
  font-size: var(--font-size-fixed-12);
  font-weight: 800;
  line-height: 1;
}

:deep(.prompt-tool-child-option.is-active .prompt-tool-checkbox) {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--surface);
}

:deep(.prompt-tool-icon) {
  width: 24px !important;
  text-align: center;
}

:deep(.prompt-tool-text) {
  display: flex;
  width: auto !important;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

:deep(.prompt-tool-text strong),
:deep(.prompt-tool-text small) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.prompt-tool-text strong) {
  font-size: var(--font-size-md);
  font-weight: 900;
  line-height: 1.2;
}

:deep(.prompt-tool-text small) {
  color: var(--muted);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.2;
}

:deep(.prompt-tool-icon-img) {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  object-fit: contain;
}
</style>
