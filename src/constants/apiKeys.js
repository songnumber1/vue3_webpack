/**
 * @file constants/apiKeys.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export const ASSISTANT_KEYS = Object.freeze({
  ID: "assistId",
  NAME: "assistName",
  ORDER: "assistOrder",
  STUDIO_YN: "studioYN",
  RAG_YN: "ragYN",
  AUTH_YN: "authYN",
  DELETE_YN: "delYN",
  PRIVATE_YN: "privateYN",
  FIX_YN: "fixYN",
  IMAGE_48_SRC: "Image48Src",
  IMAGE_20_SRC: "image20Src",
  IMAGE_16_SRC: "image16Src",
});

export const MODEL_KEYS = Object.freeze({
  ID: "modelId",
  NAME: "modelName",
  TYPE: "ModelType",
  ASSISTANT_ID: "assistId",
  ORDER: "modelOrder",
  AUTH_YN: "authYN",
  DELETE_YN: "delYN",
});

export const CHAT_KEYS = Object.freeze({
  ID: "chatId",
  TITLE: "chatTitle",
  MODEL_ID: "modelId",
  LEGACY_MODEL_ID: "modeId",
  BOOKMARK_YN: "bookmarkYN",
  ENDED_AT: "chatEndDt",
  USER_ID: "userId",
});

export const MESSAGE_KEYS = Object.freeze({
  ID: "id",
  ROLE: "role",
  CONTENT: "content",
  SENT_AT: "sendTime",
  REFERENCES: "references",
  LEGACY_REFERENCES: "refreences",
  REASONING_CONTENT: "reasoningContent",
  REASONING_STATUS: "reasoningStatus",
});
