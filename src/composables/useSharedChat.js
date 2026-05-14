/**
 * @file useSharedChat.js
 * @description Shared-chat message loader used by shared URL routes.
 * @author OpenAI
 */

import { createId } from "@/utils/id";

/**
 * Builds read-only messages for a shared conversation URL.
 * Replace this function with an API call when the backend shared-chat endpoint is ready.
 * @param {string|number} shareId Shared conversation identifier from route params
 * @returns {Promise<Array<{id: string, role: string, content: string}>>} Shared chat messages
 */
export async function loadSharedConversation(shareId) {
  const normalizedShareId = String(shareId || "").trim();
  return [
    {
      id: createId("message"),
      role: "user",
      content: `공유 URL로 전달된 대화입니다.\n\nshareId: ${normalizedShareId || "unknown"}`,
    },
    {
      id: createId("message"),
      role: "assistant",
      content:
        "이 화면은 공유 받은 대화 전용 읽기 모드입니다. 기존 채팅 화면과 동일한 메시지 레이아웃을 사용하지만 하단 입력 영역은 전송 가능한 입력창이 아니라 안내 영역으로 표시됩니다.",
    },
  ];
}
