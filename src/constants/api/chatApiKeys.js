/**
 * @file constants/api/chatApiKeys.js
 * @description 채팅방 목록/검색/생성/수정 API 원본 key 모음입니다.
 */

export const CHAT_API_KEYS = Object.freeze({
  CHAT_ID: "chatId",
  CHAT_TITLE: "chatTitle",
  CHAT_TITLE_LEGACY_TYPO: "ChatTilte",
  MODEL_ID: "modelId",
  MODEL_ID_LEGACY: "modeId",
  ASSIST_ID: "assistId",
  ASSISTANT_ID: "assistantId",
  BOOKMARK_YN: "bookmarkYN",
  CHAT_END_DT: "chatEndDt",
  USER_ID: "userId",
  USER_NAME: "userName",
  DAY_GROUP: "dayGroup",
  ENTRY_TYPE: "entryType",
  TITLE: "title",
  SNIPPET: "snippet",
  PREVIEW: "preview",
  MATCH_COUNT: "matchCount",
  HISTORY: "history",
  MESSAGES: "messages",
  PROMPTS: "prompts",
  IS_REASONING: "isReasoning",
  REASON: "reason",
});

export default CHAT_API_KEYS;
