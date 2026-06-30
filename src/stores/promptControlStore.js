import {defineStore} from "pinia";
import {
  DEFAULT_PROMPT_TOOL_SETTINGS,
  DRAFT_PROMPT_TOOL_SETTINGS_KEY,
} from "@/constants/promptComposer";

function normalizeScopeId(scopeId) {
  return String(scopeId || "default");
}

function normalizePromptToolSettingsKey(chatId) {
  return String(chatId || "").trim() || DRAFT_PROMPT_TOOL_SETTINGS_KEY;
}

function clonePromptToolSettings(settings = {}) {
  return {
    knowledgeSearch: Array.isArray(settings.knowledgeSearch)
      ? [...settings.knowledgeSearch]
      : [],
    webSearch: settings.webSearch || null,
    webSearchEnabled: Boolean(settings.webSearchEnabled),
    promptTemplateId: settings.promptTemplateId || null,
    promptTemplateOptions: {...(settings.promptTemplateOptions || {})},
  };
}

function normalizePromptText(value) {
  return typeof value === "string" ? value : String(value || "");
}

function getActivePromptKey(state) {
  return normalizePromptToolSettingsKey(state.activePromptToolSettingsKey);
}

function updatePromptToolSettings(settingsMap, key, updater) {
  const current = clonePromptToolSettings(
    settingsMap[key] || DEFAULT_PROMPT_TOOL_SETTINGS
  );
  updater(current);
  return {
    ...settingsMap,
    [key]: current,
  };
}

export const usePromptControlStore = defineStore("promptControl", {
  state: () => ({
    activePromptMenuMap: {},
    promptMobileSheetMap: {},
    activePromptToolSettingsKey: DRAFT_PROMPT_TOOL_SETTINGS_KEY,
    promptToolSettingsMap: {},
    promptTextMap: {},
    promptExpandedMap: {},
  }),
  getters: {
    hasAnyPromptMenuOpen: (state) =>
      Object.values(state.activePromptMenuMap || {}).some(Boolean),
    activePromptToolSettings: (state) => {
      const key = getActivePromptKey(state);
      return clonePromptToolSettings(
        state.promptToolSettingsMap[key] || DEFAULT_PROMPT_TOOL_SETTINGS
      );
    },
    activePromptText: (state) =>
      normalizePromptText(state.promptTextMap[getActivePromptKey(state)]),
    activePromptExpanded: (state) =>
      Boolean(state.promptExpandedMap[getActivePromptKey(state)]),
  },
  actions: {
    getActivePromptMenu(scopeId) {
      return this.activePromptMenuMap[normalizeScopeId(scopeId)] || null;
    },
    setActivePromptMenu(scopeId, menuType) {
      const key = normalizeScopeId(scopeId);
      this.activePromptMenuMap = {
        ...this.activePromptMenuMap,
        [key]: menuType || null,
      };
    },
    openPromptMenu(scopeId, menuType) {
      this.setActivePromptMenu(scopeId, menuType);
    },
    closePromptMenu(scopeId, menuType = "") {
      const key = normalizeScopeId(scopeId);
      const current = this.getActivePromptMenu(key);
      if (menuType && current !== menuType) return;
      this.setActivePromptMenu(key, null);
    },
    togglePromptMenu(scopeId, menuType) {
      const current = this.getActivePromptMenu(scopeId);
      this.setActivePromptMenu(scopeId, current === menuType ? null : menuType);
    },
    isPromptMenuOpen(scopeId, menuType) {
      return this.getActivePromptMenu(scopeId) === menuType;
    },
    setPromptMobileSheet(scopeId, value) {
      const key = normalizeScopeId(scopeId);
      const nextValue = Boolean(value);
      if (this.promptMobileSheetMap[key] === nextValue) return;

      this.promptMobileSheetMap = {
        ...this.promptMobileSheetMap,
        [key]: nextValue,
      };
    },
    clearPromptScope(scopeId) {
      const key = normalizeScopeId(scopeId);
      const nextMenus = {...this.activePromptMenuMap};
      const nextSheets = {...this.promptMobileSheetMap};
      delete nextMenus[key];
      delete nextSheets[key];
      this.activePromptMenuMap = nextMenus;
      this.promptMobileSheetMap = nextSheets;
    },

    setActivePromptToolSettingsKey(chatId) {
      const nextKey = normalizePromptToolSettingsKey(chatId);
      if (this.activePromptToolSettingsKey === nextKey) return;

      this.activePromptToolSettingsKey = nextKey;
    },
    setActivePromptText(value) {
      const key = getActivePromptKey(this);
      this.promptTextMap = {
        ...this.promptTextMap,
        [key]: normalizePromptText(value),
      };
    },
    setActivePromptExpanded(value) {
      const key = getActivePromptKey(this);
      const nextValue = Boolean(value);
      if (this.promptExpandedMap[key] === nextValue) return;

      this.promptExpandedMap = {
        ...this.promptExpandedMap,
        [key]: nextValue,
      };
    },
    ensurePromptToolSettings() {
      const key = getActivePromptKey(this);
      if (!this.promptToolSettingsMap[key]) {
        this.promptToolSettingsMap = {
          ...this.promptToolSettingsMap,
          [key]: clonePromptToolSettings(DEFAULT_PROMPT_TOOL_SETTINGS),
        };
      }
      return key;
    },
    resetActivePromptToolSettings() {
      const key = getActivePromptKey(this);
      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [key]: clonePromptToolSettings(DEFAULT_PROMPT_TOOL_SETTINGS),
      };
    },
    prunePromptToolSettingsCache(keepChatId) {
      const keepId = String(keepChatId || "");
      const nextPromptToolSettingsMap = {};

      Object.entries(this.promptToolSettingsMap || {}).forEach(
        ([chatId, settings]) => {
          if (
            String(chatId) === keepId ||
            String(chatId) === DRAFT_PROMPT_TOOL_SETTINGS_KEY
          ) {
            nextPromptToolSettingsMap[chatId] =
              clonePromptToolSettings(settings);
          }
        }
      );

      this.promptToolSettingsMap = nextPromptToolSettingsMap;

      const nextPromptTextMap = {};
      Object.entries(this.promptTextMap || {}).forEach(([chatId, value]) => {
        if (
          String(chatId) === keepId ||
          String(chatId) === DRAFT_PROMPT_TOOL_SETTINGS_KEY
        ) {
          nextPromptTextMap[chatId] = normalizePromptText(value);
        }
      });
      this.promptTextMap = nextPromptTextMap;

      const nextPromptExpandedMap = {};
      Object.entries(this.promptExpandedMap || {}).forEach(
        ([chatId, value]) => {
          if (
            String(chatId) === keepId ||
            String(chatId) === DRAFT_PROMPT_TOOL_SETTINGS_KEY
          ) {
            nextPromptExpandedMap[chatId] = Boolean(value);
          }
        }
      );
      this.promptExpandedMap = nextPromptExpandedMap;
    },
    promoteDraftPromptToolSettingsToChat(chatId) {
      const id = String(chatId || "").trim();
      if (!id) return;

      const draftSettings = clonePromptToolSettings(
        this.promptToolSettingsMap[DRAFT_PROMPT_TOOL_SETTINGS_KEY] ||
          DEFAULT_PROMPT_TOOL_SETTINGS
      );

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [id]: draftSettings,
        [DRAFT_PROMPT_TOOL_SETTINGS_KEY]: clonePromptToolSettings(
          DEFAULT_PROMPT_TOOL_SETTINGS
        ),
      };

      const draftText = normalizePromptText(
        this.promptTextMap[DRAFT_PROMPT_TOOL_SETTINGS_KEY]
      );
      this.promptTextMap = {
        ...this.promptTextMap,
        [id]: draftText,
        [DRAFT_PROMPT_TOOL_SETTINGS_KEY]: "",
      };

      const draftExpanded = Boolean(
        this.promptExpandedMap[DRAFT_PROMPT_TOOL_SETTINGS_KEY]
      );
      this.promptExpandedMap = {
        ...this.promptExpandedMap,
        [id]: draftExpanded,
        [DRAFT_PROMPT_TOOL_SETTINGS_KEY]: false,
      };
      this.setActivePromptToolSettingsKey(id);
    },
    resetActivePromptTemplate() {
      const key = this.ensurePromptToolSettings();
      this.promptToolSettingsMap = updatePromptToolSettings(
        this.promptToolSettingsMap,
        key,
        (current) => {
          current.promptTemplateId = null;
          current.promptTemplateOptions = {};
        }
      );
    },
    setActivePromptTemplate(templateId) {
      const key = this.ensurePromptToolSettings();
      this.promptToolSettingsMap = updatePromptToolSettings(
        this.promptToolSettingsMap,
        key,
        (current) => {
          current.promptTemplateId =
            current.promptTemplateId === templateId ? null : templateId;
          current.promptTemplateOptions = {};
        }
      );
    },
    setPromptTemplateOption(groupId, optionTag) {
      const key = this.ensurePromptToolSettings();
      this.promptToolSettingsMap = updatePromptToolSettings(
        this.promptToolSettingsMap,
        key,
        (current) => {
          current.promptTemplateOptions = {
            ...current.promptTemplateOptions,
            [groupId]: optionTag,
          };
        }
      );
    },
    setWebSearchEnabled(enabled) {
      const key = this.ensurePromptToolSettings();
      this.promptToolSettingsMap = updatePromptToolSettings(
        this.promptToolSettingsMap,
        key,
        (current) => {
          current.webSearchEnabled = Boolean(enabled);
          if (!enabled) current.webSearch = null;
        }
      );
    },
    toggleKnowledgeSearchOption(optionId) {
      const key = this.ensurePromptToolSettings();
      this.promptToolSettingsMap = updatePromptToolSettings(
        this.promptToolSettingsMap,
        key,
        (current) => {
          const values = Array.isArray(current.knowledgeSearch)
            ? current.knowledgeSearch
            : [];
          current.knowledgeSearch = values.includes(optionId)
            ? values.filter((value) => value !== optionId)
            : [...values, optionId];
        }
      );
    },
    toggleWebSearchEngine(engineId) {
      const key = this.ensurePromptToolSettings();
      this.promptToolSettingsMap = updatePromptToolSettings(
        this.promptToolSettingsMap,
        key,
        (current) => {
          current.webSearch = current.webSearch === engineId ? null : engineId;
          current.webSearchEnabled = Boolean(current.webSearch);
        }
      );
    },
  },
});
