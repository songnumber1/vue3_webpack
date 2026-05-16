import {MOBILE_BREAKPOINT_PX} from '@/constants/uiTokens';

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
export const PROMPT_VIEWPORT_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX}px)`;
export const PROMPT_MENU_TYPE = Object.freeze({
  model: 'model',
  tool: 'tool',
  attach: 'attach',
});
export const PROMPT_SPEECH_LANGUAGE = 'ko-KR';

export const PROMPT_TEXTAREA_HEIGHT = Object.freeze({
  min: 38,
  mobileMax: 136,
  desktopMax: 160,
});

export const ANDROID_TO_JS_EVENT = 'android-to-js';
export const NATIVE_FILE_SELECTED_TYPE = 'ON_FILE_SELECTED';
export const IMAGE_PREVIEW_EVENT = 'chat:image-preview';

export const FILE_PICKER_TYPE = Object.freeze({
  camera: 'camera',
  image: 'image',
  all: 'all',
});

export const FILE_ACCEPT = Object.freeze({
  image: 'image/*',
  all: '',
});

export const CAMERA_CAPTURE_MODE = 'environment';

export const DEFAULT_FALLBACK_MODEL = Object.freeze({
  label: '빠른 모델',
  description: '현재 선택된 모델',
});

export const PROMPT_TOOL_DEFINITIONS = Object.freeze([
  {
    id: 'image',
    icon: '▧',
    labelKey: 'chat.suggestions.image',
    prompt: '이미지 생성 프롬프트를 만들어줘',
  },
  {
    id: 'write',
    icon: '✎',
    labelKey: 'chat.suggestions.writing',
    prompt: '아래 내용을 더 자연스럽게 다듬어줘',
  },
  {
    id: 'find',
    icon: '◎',
    labelKey: 'chat.suggestions.search',
    prompt: '프로젝트에서 빠진 항목을 찾아줘',
  },
]);

export const ATTACH_MENU_OPTIONS = Object.freeze([
  {
    id: FILE_PICKER_TYPE.camera,
    icon: '📷',
    labelKey: 'chat.attachOptions.camera',
    nativeSource: FILE_PICKER_TYPE.camera,
    accept: FILE_ACCEPT.image,
    capture: CAMERA_CAPTURE_MODE,
    multiple: false,
    requiresCamera: true,
  },
  {
    id: FILE_PICKER_TYPE.image,
    icon: '🖼️',
    labelKey: 'chat.attachOptions.image',
    nativeSource: FILE_PICKER_TYPE.image,
    accept: FILE_ACCEPT.image,
    capture: null,
    multiple: true,
    requiresCamera: false,
  },
  {
    id: FILE_PICKER_TYPE.all,
    icon: '📎',
    labelKey: 'chat.attachOptions.file',
    nativeSource: FILE_PICKER_TYPE.all,
    accept: FILE_ACCEPT.all,
    capture: null,
    multiple: true,
    requiresCamera: false,
  },
]);
