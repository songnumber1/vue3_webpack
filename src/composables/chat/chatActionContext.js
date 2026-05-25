/**
 * @file composables/chat/chatActionContext.js
 * @description 채팅 도메인 composable입니다. 질문 전송, 메시지 동기화, SSE 결과 반영, scroll/overlay action을 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export const CHAT_ACTIONS_KEY = Symbol("CHAT_ACTIONS");
export const WORKSPACE_ACTIONS_KEY = Symbol("WORKSPACE_ACTIONS");

export function createEmptyChatActions() {
  return {
    openDrawer: () => {},
    toggleTheme: () => {},
    openSwagger: () => {},
    openSettings: () => {},
    openAssistant: () => {},
    openGuide: () => {},
    openNotice: () => {},
    openPrivacy: () => {},
    openTerms: () => {},
    openPersonalization: () => {},
    openSystem: () => {},
    openLanguage: () => {},
    openPlayground: () => {},
    logout: () => {},
  };
}

export function createEmptyWorkspaceActions() {
  return {
    submit: () => {},
    regenerate: () => {},
    updateSelectedModel: () => {},
    handlePromptFocus: () => {},
    handlePromptResize: () => {},
    handleMessageContentRendered: () => {},
    scrollBottom: () => {},
  };
}
