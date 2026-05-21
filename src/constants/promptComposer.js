import {MOBILE_BREAKPOINT_PX} from "@/constants/uiTokens";
import cameraIcon from "@/assets/img/icons/camera.svg";
import fileIcon from "@/assets/img/icons/file.svg";
import imageFileIcon from "@/assets/img/icons/image.svg";
import knowledgeIcon from "@/assets/img/icons/knowledge.svg";
import promptFindIcon from "@/assets/img/icons/prompt-find.svg";
import promptImageIcon from "@/assets/img/icons/prompt-image.svg";
import promptWriteIcon from "@/assets/img/icons/prompt-write.svg";
import webSearchIcon from "@/assets/img/icons/web-search.svg";


export const PROMPT_VIEWPORT_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX}px)`;
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

export const PROMPT_TOOL_DEFINITIONS = Object.freeze([
  {
    id: "image",
    iconSrc: promptImageIcon,
    labelKey: "chat.suggestions.image",
    prompt: "이미지 생성 프롬프트를 만들어줘",
  },
  {
    id: "write",
    iconSrc: promptWriteIcon,
    labelKey: "chat.suggestions.writing",
    prompt: "아래 내용을 더 자연스럽게 다듬어줘",
  },
  {
    id: "find",
    iconSrc: promptFindIcon,
    labelKey: "chat.suggestions.search",
    prompt: "프로젝트에서 빠진 항목을 찾아줘",
  },
  {
    id: "knowledge-search",
    iconSrc: knowledgeIcon,
    labelKey: "chat.suggestions.knowledgeSearch",
    settingGroup: PROMPT_TOOL_SETTING_GROUP.knowledge,
    selectionMode: PROMPT_TOOL_SELECTION_MODE.multiple,
    childControlType: PROMPT_TOOL_CONTROL_TYPE.checkbox,
    children: [
      {
        id: "knowledge-paper",
        iconSrc: fileIcon,
        labelKey: "chat.suggestions.knowledge.paper",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.knowledge,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.multiple,
        controlType: PROMPT_TOOL_CONTROL_TYPE.checkbox,
      },
      {
        id: "knowledge-confluence",
        iconSrc: knowledgeIcon,
        labelKey: "chat.suggestions.knowledge.confluence",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.knowledge,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.multiple,
        controlType: PROMPT_TOOL_CONTROL_TYPE.checkbox,
      },
      {
        id: "knowledge-jira",
        iconSrc: knowledgeIcon,
        labelKey: "chat.suggestions.knowledge.jira",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.knowledge,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.multiple,
        controlType: PROMPT_TOOL_CONTROL_TYPE.checkbox,
      },
    ],
  },
  {
    id: "web-search",
    iconSrc: webSearchIcon,
    labelKey: "chat.suggestions.webSearch",
    settingGroup: PROMPT_TOOL_SETTING_GROUP.web,
    selectionMode: PROMPT_TOOL_SELECTION_MODE.single,
    parentControlType: PROMPT_TOOL_CONTROL_TYPE.switch,
    childControlType: PROMPT_TOOL_CONTROL_TYPE.selectedRow,
    children: [
      {
        id: "web-perplexity",
        iconSrc: webSearchIcon,
        labelKey: "chat.suggestions.web.perplexity",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.web,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.single,
        controlType: PROMPT_TOOL_CONTROL_TYPE.selectedRow,
      },
      {
        id: "web-google-ai-overviews",
        iconSrc: webSearchIcon,
        labelKey: "chat.suggestions.web.googleAiOverviews",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.web,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.single,
        controlType: PROMPT_TOOL_CONTROL_TYPE.selectedRow,
      },
      {
        id: "web-chatgpt-search",
        iconSrc: webSearchIcon,
        labelKey: "chat.suggestions.web.chatgptSearch",
        settingGroup: PROMPT_TOOL_SETTING_GROUP.web,
        selectionMode: PROMPT_TOOL_SELECTION_MODE.single,
        controlType: PROMPT_TOOL_CONTROL_TYPE.selectedRow,
      },
      {
        id: "web-microsoft-copilot",
        iconSrc: webSearchIcon,
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
    iconSrc: cameraIcon,
    labelKey: "chat.attachOptions.camera",
    nativeSource: FILE_PICKER_TYPE.camera,
    accept: FILE_ACCEPT.image,
    capture: CAMERA_CAPTURE_MODE,
    multiple: false,
    requiresCamera: true,
  },
  {
    id: FILE_PICKER_TYPE.image,
    iconSrc: imageFileIcon,
    labelKey: "chat.attachOptions.image",
    nativeSource: FILE_PICKER_TYPE.image,
    accept: FILE_ACCEPT.image,
    capture: null,
    multiple: true,
    requiresCamera: false,
  },
  {
    id: FILE_PICKER_TYPE.all,
    iconSrc: fileIcon,
    labelKey: "chat.attachOptions.file",
    nativeSource: FILE_PICKER_TYPE.all,
    accept: FILE_ACCEPT.all,
    capture: null,
    multiple: true,
    requiresCamera: false,
  },
]);
