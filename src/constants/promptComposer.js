/**
 * @file constants/promptComposer.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
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
  attach: "attach",
});
export const PROMPT_SPEECH_LANGUAGE = "ko-KR";

export const PROMPT_TEXTAREA_HEIGHT = Object.freeze({
  min: 38,
  mobileMax: 136,
  desktopMax: 160,
  maxRows: 8,
  lineHeight: 20,
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

export const PROMPT_TEMPLATE_MODEL_IDS = Object.freeze([
  "model-ds-thinking",
  "model-ds-rag",
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
