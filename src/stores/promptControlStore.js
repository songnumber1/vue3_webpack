/**
 * @file stores/promptControlStore.js
 * @description PromptComposer 하위 메뉴/바텀시트 열림 상태와 입력 도구 설정을 Pinia에서 관리합니다.
 *
 * 2단계 리팩토링 기준:
 * - UI 구조와 props/emit 연결은 변경하지 않습니다.
 * - PC/모바일 direct import 분리를 위해 Prompt Tool 상태를 chatStore에서 분리합니다.
 * - 기존 chatStore API는 호환 proxy로 유지합니다.
 */

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
      const key = normalizePromptToolSettingsKey(
        state.activePromptToolSettingsKey
      );
      return clonePromptToolSettings(
        state.promptToolSettingsMap[key] || DEFAULT_PROMPT_TOOL_SETTINGS
      );
    },
    activePromptText: (state) => {
      const key = normalizePromptToolSettingsKey(
        state.activePromptToolSettingsKey
      );
      return normalizePromptText(state.promptTextMap[key]);
    },
    activePromptExpanded: (state) => {
      const key = normalizePromptToolSettingsKey(
        state.activePromptToolSettingsKey
      );
      return Boolean(state.promptExpandedMap[key]);
    },
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
    isPromptMobileSheet(scopeId) {
      return Boolean(this.promptMobileSheetMap[normalizeScopeId(scopeId)]);
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
    getPromptTextKey() {
      return normalizePromptToolSettingsKey(this.activePromptToolSettingsKey);
    },
    getPromptTextForKey(chatId) {
      const key = normalizePromptToolSettingsKey(chatId);
      return normalizePromptText(this.promptTextMap[key]);
    },
    setActivePromptText(value) {
      const key = this.getPromptTextKey();
      this.promptTextMap = {
        ...this.promptTextMap,
        [key]: normalizePromptText(value),
      };
    },
    setPromptTextForKey(chatId, value) {
      const key = normalizePromptToolSettingsKey(chatId);
      this.promptTextMap = {
        ...this.promptTextMap,
        [key]: normalizePromptText(value),
      };
    },
    clearActivePromptText() {
      this.setActivePromptText("");
    },
    getPromptExpandedForKey(chatId) {
      const key = normalizePromptToolSettingsKey(chatId);
      return Boolean(this.promptExpandedMap[key]);
    },
    setActivePromptExpanded(value) {
      const key = this.getPromptTextKey();
      const nextValue = Boolean(value);
      if (this.promptExpandedMap[key] === nextValue) return;

      this.promptExpandedMap = {
        ...this.promptExpandedMap,
        [key]: nextValue,
      };
    },
    setPromptExpandedForKey(chatId, value) {
      const key = normalizePromptToolSettingsKey(chatId);
      const nextValue = Boolean(value);
      if (this.promptExpandedMap[key] === nextValue) return;

      this.promptExpandedMap = {
        ...this.promptExpandedMap,
        [key]: nextValue,
      };
    },
    clearActivePromptExpanded() {
      this.setActivePromptExpanded(false);
    },
    getPromptToolSettingsKey() {
      return normalizePromptToolSettingsKey(this.activePromptToolSettingsKey);
    },
    getPromptToolSettingsForKey(chatId) {
      const key = normalizePromptToolSettingsKey(chatId);
      return clonePromptToolSettings(
        this.promptToolSettingsMap[key] || DEFAULT_PROMPT_TOOL_SETTINGS
      );
    },
    ensurePromptToolSettings() {
      const key = this.getPromptToolSettingsKey();
      if (!this.promptToolSettingsMap[key]) {
        this.promptToolSettingsMap = {
          ...this.promptToolSettingsMap,
          [key]: clonePromptToolSettings(DEFAULT_PROMPT_TOOL_SETTINGS),
        };
      }
      return key;
    },
    setPromptToolSettingsForKey(chatId, settings) {
      const key = normalizePromptToolSettingsKey(chatId);
      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [key]: clonePromptToolSettings(settings),
      };
    },
    resetActivePromptToolSettings() {
      const key = this.getPromptToolSettingsKey();
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
      const current = clonePromptToolSettings(this.promptToolSettingsMap[key]);
      current.promptTemplateId = null;
      current.promptTemplateOptions = {};

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [key]: current,
      };
    },
    setActivePromptTemplate(templateId) {
      const key = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(this.promptToolSettingsMap[key]);
      const nextTemplateId =
        current.promptTemplateId === templateId ? null : templateId;
      current.promptTemplateId = nextTemplateId;
      current.promptTemplateOptions = {};

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [key]: current,
      };
    },
    setPromptTemplateOption(groupId, optionTag) {
      const key = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(this.promptToolSettingsMap[key]);
      current.promptTemplateOptions = {
        ...current.promptTemplateOptions,
        [groupId]: optionTag,
      };

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [key]: current,
      };
    },
    setWebSearchEnabled(enabled) {
      const key = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(this.promptToolSettingsMap[key]);
      current.webSearchEnabled = Boolean(enabled);
      if (!enabled) current.webSearch = null;

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [key]: current,
      };
    },
    toggleKnowledgeSearchOption(optionId) {
      const key = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(this.promptToolSettingsMap[key]);
      const values = Array.isArray(current.knowledgeSearch)
        ? current.knowledgeSearch
        : [];
      current.knowledgeSearch = values.includes(optionId)
        ? values.filter((value) => value !== optionId)
        : [...values, optionId];

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [key]: current,
      };
    },
    toggleWebSearchEngine(engineId) {
      const key = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(this.promptToolSettingsMap[key]);
      current.webSearch = current.webSearch === engineId ? null : engineId;
      current.webSearchEnabled = Boolean(current.webSearch);

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [key]: current,
      };
    },
  },
});
