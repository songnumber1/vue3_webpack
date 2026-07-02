/**
 * @file composables/chat/chatStateContext.js
 * @description 채팅 화면과 Prompt 하위 컴포넌트가 공유하는 상태 provide/inject key와 기본 상태를 정의합니다.
 */

/**
 * @constant {String} CHAT_WORKSPACE_STATE_KEY
 * @description 채팅 화면 렌더링에 필요한 상태를 props 대신 provide/inject로 공유하기 위한 키입니다.
 */
export const CHAT_WORKSPACE_STATE_KEY = "CHAT_WORKSPACE_STATE";

/**
 * @constant {String} PROMPT_STATE_KEY
 * @description 프롬프트 입력 영역의 모델/생성/모바일 상태를 props 대신 provide/inject로 공유하기 위한 키입니다.
 */
export const PROMPT_STATE_KEY = "PROMPT_STATE";

/**
 * @constant {String} PROMPT_TOOLBAR_STATE_KEY
 * @description PromptComposer 내부 툴바/전송 버튼 상태를 하위 툴바 컴포넌트에 props 없이 공유하기 위한 키입니다.
 */
export const PROMPT_TOOLBAR_STATE_KEY = "PROMPT_TOOLBAR_STATE";

/**
 * @constant {String} PROMPT_TEXTAREA_STATE_KEY
 * @description PromptTextarea의 텍스트/placeholder/전송 차단 상태를 props 없이 공유하기 위한 키입니다.
 */
export const PROMPT_TEXTAREA_STATE_KEY = "PROMPT_TEXTAREA_STATE";

export function createEmptyWorkspaceState() {
  return {
    mode: "main",
    readonly: false,
    assistantLabel: "Assistant",
    assistant: null,
    conversationTitle: "",
    themeName: "light",
    suggestions: [],
    isActiveModelDeleted: false,
    isActiveModelUnavailable: false,
    isGenerating: false,
    messages: [],
    showScrollBottom: false,
    isHistoryRendering: false,
    historyMessagesLoaded: false,
  };
}

export function createEmptyPromptState() {
  return {
    floating: false,
    showHelp: false,
    selectedModel: "",
    models: [],
    disabled: false,
    generating: false,
    modelReadonly: false,
    placeholder: "",
  };
}

export function createEmptyPromptToolbarState() {
  return {
    disabled: false,
    modelReadonly: false,
    modelValue: "",
    currentModel: {id: "", label: ""},
    models: [],
    selectedTemplateTool: null,
    attachOptions: [],
    modelMenuOpen: false,
    toolMenuOpen: false,
    attachMenuOpen: false,
    canSubmit: false,
    hasPromptText: false,
    isMicEnabled: false,
    isVoiceListening: false,
    hasVoiceStopped: false,
    generating: false,
    isSpeechSupported: true,
    voiceStartLabel: "Start voice input",
    voiceStopLabel: "Stop voice input",
    attachLabel: "Attach",
    sendLabel: "Send",
    modelSelectLabel: "Select model",
    readonlyTitle: "",
  };
}
