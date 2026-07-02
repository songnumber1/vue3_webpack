/**
 * @file constants/promptComposer.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 */

export const DRAFT_PROMPT_TOOL_SETTINGS_KEY = "__draft__";

export const DEFAULT_PROMPT_TOOL_SETTINGS = Object.freeze({
  knowledgeSearch: [],
  webSearch: null,
  webSearchEnabled: false,
  promptTemplateId: null,
  promptTemplateOptions: {},
});

export const PROMPT_MENU_TYPE = Object.freeze({
  model: "model",
  tool: "tool",
});
export const PROMPT_SPEECH_LANGUAGE = "ko-KR";

export const PROMPT_TEXTAREA_HEIGHT = Object.freeze({
  min: 38,
  mobileMax: 136,
  max: 160,
  maxRows: 8,
  lineHeight: 20,
});

export const IMAGE_PREVIEW_EVENT = "chat:image-preview";

export const DEFAULT_FALLBACK_MODEL = Object.freeze({
  label: "빠른 모델",
  description: "현재 선택된 모델",
});

export const PROMPT_TEMPLATE_MODEL_IDS = Object.freeze([
  "model-ds-thinking",
  "model-ds-rag",
]);
