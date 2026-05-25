/**
 * @file constants/promptComposer.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export const PROMPT_MENU_TYPE = Object.freeze({
  model: "model",
  tool: "tool",
  attach: "attach",
});
export const PROMPT_SPEECH_LANGUAGE = "ko-KR";

export const PROMPT_TEXTAREA_HEIGHT = Object.freeze({
  min: 38,
  mobileMax: 136,
  desktopMax: 160,
});

export const ANDROID_TO_JS_EVENT = "android-to-js";
export const NATIVE_FILE_SELECTED_TYPE = "ON_FILE_SELECTED";
export const IMAGE_PREVIEW_EVENT = "chat:image-preview";

export const FILE_PICKER_TYPE = Object.freeze({
  camera: "camera",
  image: "image",
  all: "all",
});

export const FILE_ACCEPT = Object.freeze({
  image: "image/*",
  all: "",
});

export const CAMERA_CAPTURE_MODE = "environment";

export const DEFAULT_FALLBACK_MODEL = Object.freeze({
  label: "빠른 모델",
  description: "현재 선택된 모델",
});

export const PROMPT_TOOL_SETTING_GROUP = Object.freeze({
  knowledge: "knowledgeSearch",
  web: "webSearch",
});

export const PROMPT_TOOL_SELECTION_MODE = Object.freeze({
  multiple: "multiple",
  single: "single",
});

export const PROMPT_TOOL_CONTROL_TYPE = Object.freeze({
  checkbox: "checkbox",
  selectedRow: "selectedRow",
  switch: "switch",
});


export const PROMPT_TEMPLATE_MODEL_IDS = Object.freeze([
  "model-ds-thinking",
  "model-ds-rag",
]);

export const PROMPT_TEMPLATE_TOOL_IDS = Object.freeze({
  mail: "prompt-template-mail",
  translate: "prompt-template-translate",
  summary: "prompt-template-summary",
  code: "prompt-template-code",
});

export const PROMPT_TOOL_DEFINITIONS = Object.freeze([
  {
    id: PROMPT_TEMPLATE_TOOL_IDS.mail,
    icon: "",
    labelKey: "chat.templates.mail",
    descriptionKey: "chat.templates.mailDescription",
    promptTemplateKey: "mail",
  },
  {
    id: PROMPT_TEMPLATE_TOOL_IDS.translate,
    icon: "",
    labelKey: "chat.templates.translate",
    descriptionKey: "chat.templates.translateDescription",
    promptTemplateKey: "translate",
  },
  {
    id: PROMPT_TEMPLATE_TOOL_IDS.summary,
    icon: "",
    labelKey: "chat.templates.summary",
    descriptionKey: "chat.templates.summaryDescription",
    promptTemplateKey: "summary",
  },
  {
    id: PROMPT_TEMPLATE_TOOL_IDS.code,
    icon: "",
    labelKey: "chat.templates.code",
    descriptionKey: "chat.templates.codeDescription",
    promptTemplateKey: "code",
  },
  {
    id: "knowledge-search",
    icon: "⌕",
    labelKey: "chat.suggestions.knowledgeSearch",
    settingGroup: PROMPT_TOOL_SETTING_GROUP.knowledge,
    selectionMode: PROMPT_TOOL_SELECTION_MODE.multiple,
    childControlType: PROMPT_TOOL_CONTROL_TYPE.checkbox,
    children: [
      {
        id: "knowledge-paper",
        icon: "◫",
        labelKey: "chat.suggestions.knowledge.paper",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.knowledge,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.multiple,
        controlType: PROMPT_TOOL_CONTROL_TYPE.checkbox,
      },
      {
        id: "knowledge-confluence",
        icon: "◆",
        labelKey: "chat.suggestions.knowledge.confluence",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.knowledge,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.multiple,
        controlType: PROMPT_TOOL_CONTROL_TYPE.checkbox,
      },
      {
        id: "knowledge-jira",
        icon: "◇",
        labelKey: "chat.suggestions.knowledge.jira",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.knowledge,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.multiple,
        controlType: PROMPT_TOOL_CONTROL_TYPE.checkbox,
      },
    ],
  },
  {
    id: "web-search",
    icon: "◉",
    labelKey: "chat.suggestions.webSearch",
    settingGroup: PROMPT_TOOL_SETTING_GROUP.web,
    selectionMode: PROMPT_TOOL_SELECTION_MODE.single,
    parentControlType: PROMPT_TOOL_CONTROL_TYPE.switch,
    childControlType: PROMPT_TOOL_CONTROL_TYPE.selectedRow,
    children: [
      {
        id: "web-perplexity",
        icon: "P",
        labelKey: "chat.suggestions.web.perplexity",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.web,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.single,
        controlType: PROMPT_TOOL_CONTROL_TYPE.selectedRow,
      },
      {
        id: "web-google-ai-overviews",
        icon: "G",
        labelKey: "chat.suggestions.web.googleAiOverviews",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.web,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.single,
        controlType: PROMPT_TOOL_CONTROL_TYPE.selectedRow,
      },
      {
        id: "web-chatgpt-search",
        icon: "O",
        labelKey: "chat.suggestions.web.chatgptSearch",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.web,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.single,
        controlType: PROMPT_TOOL_CONTROL_TYPE.selectedRow,
      },
      {
        id: "web-microsoft-copilot",
        icon: "M",
        labelKey: "chat.suggestions.web.microsoftCopilot",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.web,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.single,
        controlType: PROMPT_TOOL_CONTROL_TYPE.selectedRow,
      },
    ],
  },
]);

export const ATTACH_MENU_OPTIONS = Object.freeze([
  {
    id: FILE_PICKER_TYPE.camera,
    icon: "📷",
    labelKey: "chat.attachOptions.camera",
    nativeSource: FILE_PICKER_TYPE.camera,
    accept: FILE_ACCEPT.image,
    capture: CAMERA_CAPTURE_MODE,
    multiple: false,
    requiresCamera: true,
  },
  {
    id: FILE_PICKER_TYPE.image,
    icon: "🖼️",
    labelKey: "chat.attachOptions.image",
    nativeSource: FILE_PICKER_TYPE.image,
    accept: FILE_ACCEPT.image,
    capture: null,
    multiple: true,
    requiresCamera: false,
  },
  {
    id: FILE_PICKER_TYPE.all,
    icon: "📎",
    labelKey: "chat.attachOptions.file",
    nativeSource: FILE_PICKER_TYPE.all,
    accept: FILE_ACCEPT.all,
    capture: null,
    multiple: true,
    requiresCamera: false,
  },
]);
