/**
 * @file useMessageRenderPolicy.js
 * @description 채팅방 진입 시점의 메시지 lazy 렌더링 사용 여부와 최초 스크롤 대상을 계산합니다.
 */

export const MESSAGE_SCROLL_TARGET_TYPES = Object.freeze({
  bottom: "bottom",
  first: "first",
  message: "message",
});

function hasSharedId(chat) {
  return String(chat?.sharedId || "").trim().length > 0;
}

export function isSharedChat(chat) {
  // 사용자가 제목에 "공유 -"를 직접 입력할 수 있으므로, 제목/문구가 아니라
  // 백엔드가 내려준 sharedId 존재 여부만 공유방 렌더 정책 기준으로 사용합니다.
  return hasSharedId(chat);
}

function normalizeMessageId(value) {
  const id = String(value || "").trim();
  return id || null;
}

/**
 * 모바일은 항상 기존 정책(lazy ON + bottom)을 유지합니다.
 * PC는 검색 결과 클릭 > 공유방 > 일반방 순서로 정책을 결정합니다.
 */
export function resolveMessageRenderPolicy({
  isMobile = false,
  selectedChat = null,
  searchTargetMessageId = null,
} = {}) {
  const targetMessageId = normalizeMessageId(searchTargetMessageId);

  if (isMobile) {
    return {
      useLazyLoading: true,
      scrollTarget: {type: MESSAGE_SCROLL_TARGET_TYPES.bottom},
    };
  }

  if (targetMessageId) {
    return {
      useLazyLoading: false,
      scrollTarget: {
        type: MESSAGE_SCROLL_TARGET_TYPES.message,
        messageId: targetMessageId,
      },
    };
  }

  if (isSharedChat(selectedChat)) {
    return {
      useLazyLoading: false,
      scrollTarget: {type: MESSAGE_SCROLL_TARGET_TYPES.first},
    };
  }

  return {
    useLazyLoading: true,
    scrollTarget: {type: MESSAGE_SCROLL_TARGET_TYPES.bottom},
  };
}
