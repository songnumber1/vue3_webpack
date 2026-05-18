import {CHAT_KEYS, MESSAGE_KEYS} from "@/constants/apiKeys";
import {MESSAGE_ROLES} from "@/constants/domain";
import {toBoolean} from "./booleanAdapter";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description adaptChatHistory 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} raw - raw 입력값입니다.
 * @param {*} context - context 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function adaptChatHistory(raw = {}, context = {}) {
  const modelId = raw[CHAT_KEYS.MODEL_ID] || raw[CHAT_KEYS.LEGACY_MODEL_ID];
  const model = context.modelMap?.[modelId] || null;
  const assistant = model ? context.assistantMap?.[model.assistId] : null;

  return {
    id: raw[CHAT_KEYS.ID],
    title: raw[CHAT_KEYS.TITLE] || "새 대화",
    preview: raw[CHAT_KEYS.TITLE] || "저장된 대화",
    modelId,
    assistantId: model?.assistId || raw.assistId || raw.assistantId || null,
    assistantType: assistant?.type || null,
    assistantLabel: assistant?.label || "",
    modelLabel: model?.label || "",
    isPinned: toBoolean(raw[CHAT_KEYS.BOOKMARK_YN]),
    endedAt: raw[CHAT_KEYS.ENDED_AT] || "",
    userId: raw[CHAT_KEYS.USER_ID] || "",
    raw,
  };
}

/**
 * @description adaptChatHistoryList 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} rawItems - rawItems 입력값입니다.
 * @param {*} context - context 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function adaptChatHistoryList(rawItems = [], context = {}) {
  return rawItems
    .map((item) => adaptChatHistory(item, context))
    .filter((item) => item.id)
    .sort((a, b) => {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

      return (
        new Date(b.endedAt || 0).getTime() - new Date(a.endedAt || 0).getTime()
      );
    });
}

/**
 * @description adaptMessage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} raw - raw 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function adaptMessage(raw = {}) {
  return {
    id: raw[MESSAGE_KEYS.ID],
    role:
      raw[MESSAGE_KEYS.ROLE] === MESSAGE_ROLES.USER
        ? MESSAGE_ROLES.USER
        : MESSAGE_ROLES.ASSISTANT,
    content: raw[MESSAGE_KEYS.CONTENT] || "",
    reasoningContent:
      raw[MESSAGE_KEYS.REASONING_CONTENT] || raw.reasoning || "",
    reasoningStatus:
      raw[MESSAGE_KEYS.REASONING_STATUS] ||
      (raw[MESSAGE_KEYS.REASONING_CONTENT] || raw.reasoning ? "completed" : ""),
    createdAt: raw[MESSAGE_KEYS.SENT_AT] || "",
    isSent: toBoolean(raw.isSend),
    isRag: toBoolean(raw.isRAG),
    isRagCot: toBoolean(raw.isRagCot),
    intention: raw.intention || null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    references:
      raw[MESSAGE_KEYS.REFERENCES] || raw[MESSAGE_KEYS.LEGACY_REFERENCES] || [],
    raw,
  };
}

/**
 * @description adaptMessageList 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} rawItems - rawItems 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function adaptMessageList(rawItems = []) {
  return rawItems
    .map(adaptMessage)
    .filter((item) => item.id && item.content !== undefined)
    .sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime()
    );
}
