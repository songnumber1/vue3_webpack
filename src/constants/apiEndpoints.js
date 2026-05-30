/**
 * @file constants/apiEndpoints.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
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
  CHAT_HISTORY_NEW: "/new.do",
  EXAMPLE_PROMPTS: "/example-prompts/list.do",
  PROMPT_TEMPLATES: "/prompt-templates/info.do",
  GENERATION: "/generation.do",
  GENERATION_RESULT: "/generation/result.do",
});
