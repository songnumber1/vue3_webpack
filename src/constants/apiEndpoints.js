/**
 * @file constants/apiEndpoints.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 */

export const API_ENDPOINTS = Object.freeze({
  ACCESS_INFO: "/access/info.do",
  ASSISTANT_INFO: "/assist/info/assist.do",
  STUDIO_INFO: "/assist/info/studio.do",
  MCP_INFO: "/assist/info/mcp.do",
  MODEL_INFO: "/model/info/model.do",
  STUDIO_MODEL_INFO: "/model/info/studio-model.do",
  FEEDBACK_HISTORY: "/message-feedback-history/ex-list.do",
  CHAT_HISTORY_LIST: "/chat-history/list.do",
  CHAT_HISTORY_DETAIL: "/chat-history/history.do",
  CHAT_HISTORY_BOOKMARK: "/chat-history/bookmark.do",
  CHAT_HISTORY_RENAME: "/chat-history/title.do",
  CHAT_HISTORY_DELETE: "/chat-history/delete.do",
  CHAT_SEARCH: "/chat-search/list.do",
  SHARED_INFO: "/shared/info.do",
  CHAT_HISTORY_NEW: "/new.do",
  EXAMPLE_PROMPTS: "/example-prompts/list.do",
  PROMPT_TEMPLATES: "/prompt-templates/info.do",
  GENERATION: "/generation.do",
  STUDIO_SEARCH_MAIN_INFO: "/studio/search/main/info.do",
  STUDIO_AUTHORITY_INFO: "/studio/main/ssg/info",
  STUDIO_SEARCH_LIST: "/studio/search/list.do",
  MCP_SEARCH_MAIN_INFO: "/mcp/search/main/info.do",
  MCP_SEARCH_LIST: "/mcp/search/list.do",
  GENERATION_RESULT: "/generation/result.do",
});
