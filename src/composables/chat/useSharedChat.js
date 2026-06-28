/**
 * @file composables/chat/useSharedChat.js
 * @description 공유 URL 진입 검증과 공유 대화방 조회를 담당합니다.
 */

import {resolveChatApis} from "@/api/runtime/chatApis";

function resolveSharedExists(response = {}, messages = []) {
  if (response.exists === false || response.success === false) return false;
  if (response.exists === true || response.success === true) return true;

  // 백엔드 응답이 비어 있거나 exists/success 플래그가 누락된 경우에는
  // 공유 URL을 성공으로 추정하지 않습니다. 없는 공유 URL이 빈 객체로
  // 내려와도 반드시 알림 후 메인으로 이동해야 하기 때문입니다.
  return messages.length > 0;
}

function normalizeSharedResponse(response = {}, shareId = "") {
  const messages = Array.isArray(response.messages) ? response.messages : [];
  const normalizedShareId = String(response.shareId || shareId || "").trim();
  const exists = resolveSharedExists(response, messages);

  return {
    ...response,
    exists,
    success: exists,
    shareId: normalizedShareId,
    chatId: response.chatId || response.id || "",
    title: response.title || response.chatTitle || "",
    code: response.code || (exists ? "" : "SHARED_NOT_FOUND"),
    message: response.message || "",
    messages,
  };
}

function createSharedUnavailableResponse(shareId) {
  const normalizedShareId = String(shareId || "").trim();

  return normalizeSharedResponse(
    {
      success: false,
      exists: false,
      shareId: normalizedShareId,
      code: "SHARED_API_UNAVAILABLE",
      message: "공유방을 찾을 수 없습니다.",
      messages: [],
    },
    normalizedShareId
  );
}

export async function getSharedConversation(shareId, options = {}) {
  const normalizedShareId = String(shareId || "").trim();
  const {chatHistoryApi} = resolveChatApis();

  if (typeof chatHistoryApi?.getSharedConversation === "function") {
    return normalizeSharedResponse(
      await chatHistoryApi.getSharedConversation(
        {shareId: normalizedShareId},
        options
      ),
      normalizedShareId
    );
  }

  // 공유 URL은 존재하지 않거나 검증 API가 준비되지 않은 경우에도 성공으로
  // 추정하지 않습니다. API 계약이 깨졌을 때도 반드시 알림 후 메인으로
  // 이동해야 하므로 fail-closed 응답으로 정규화합니다.
  return createSharedUnavailableResponse(normalizedShareId);
}

export async function loadSharedConversation(shareId, options = {}) {
  const result = await getSharedConversation(shareId, options);
  if (!result.exists) {
    const error = new Error(result.message || "공유방을 찾을 수 없습니다.");
    error.code = result.code || "SHARED_NOT_FOUND";
    error.sharedResult = result;
    throw error;
  }
  return result.messages;
}
