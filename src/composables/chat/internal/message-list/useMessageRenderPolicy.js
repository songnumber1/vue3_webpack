/**
 * @file useMessageRenderPolicy.js
 * @description 모바일 전용 대화방 진입 시 최초 스크롤 위치만 계산합니다.
 */

import {MESSAGE_SCROLL_TARGET_TYPES} from "./messageRenderPolicyTypes";
import {normalizeNullableMessageId} from "@/utils/normalize";

function hasSharedId(chat) {
  return String(chat?.sharedId || "").trim().length > 0;
}

export function isSharedChat(chat) {
  return hasSharedId(chat);
}

export function resolveMessageRenderPolicy(
  selectedChat = null,
  searchTargetMessageId = null
) {
  const targetMessageId = normalizeNullableMessageId(searchTargetMessageId);

  if (targetMessageId) {
    return {
      scrollTarget: {
        type: MESSAGE_SCROLL_TARGET_TYPES.message,
        messageId: targetMessageId,
      },
    };
  }

  if (isSharedChat(selectedChat)) {
    return {scrollTarget: {type: MESSAGE_SCROLL_TARGET_TYPES.first}};
  }

  return {scrollTarget: {type: MESSAGE_SCROLL_TARGET_TYPES.bottom}};
}
