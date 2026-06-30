/**
 * @file composables/chat/conversation/activeConversationCleanupRegistry.js
 * @description 현재 활성 ChatContainer가 소유한 메시지 배열/첨부 리소스 정리 함수를 영역 밖 action에서 재사용하기 위한 얇은 registry입니다.
 * UI 컴포넌트에 직접 로직을 박지 않고 Sidebar action에서도 기존 대화방 첨부 Blob URL 정리를 유지합니다.
 */

let activeCleanupHandler = null;

export function registerActiveConversationCleanup(handler) {
  if (typeof handler !== "function") return () => {};
  activeCleanupHandler = handler;

  return () => {
    if (activeCleanupHandler === handler) {
      activeCleanupHandler = null;
    }
  };
}

export function cleanupActiveConversationForNavigation() {
  if (typeof activeCleanupHandler !== "function") return false;
  activeCleanupHandler();
  return true;
}
