/**
 * @file composables/chat/chatStateContext.js
 * @description 채팅 화면과 Prompt 하위 컴포넌트가 공유하는 상태 provide/inject key와 기본 상태를 정의합니다.
 */

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
    isMobileSheet: true,
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
