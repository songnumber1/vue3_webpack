/**
 * @file constants/api/sseResponseKeys.js
 * @description SSE/OpenAI 호환 스트림 응답 원본 key 및 토큰 모음입니다.
 */

export const SSE_RESPONSE_KEYS = Object.freeze({
  DATA: "data",
  CHOICES: "choices",
  DELTA: "delta",
  CONTENT: "content",
  MESSAGE: "message",
  ERROR: "error",
  DONE: "done",
  FINISH_REASON: "finish_reason",
  REASONING_CONTENT: "reasoning_content",
  REASONING_CONTENT_CAMEL: "reasoningContent",
  REASONING: "reasoning",
  REASON_CONTENT: "reasonContent",
  INDEX: "index",
  LOGPROBS: "logprobs",
  TOKEN_IDS: "token_ids",
  ID: "id",
  CREATED: "created",
  MODEL: "model",
  OBJECT: "object",
  SERVICE_TIER: "service_tier",
  SYSTEM_FINGERPRINT: "system_fingerprint",
  USAGE: "usage",
});

export const SSE_RESPONSE_TOKENS = Object.freeze({
  DONE: "[DONE]",
  DATA_PREFIX: "data:",
  EVENT_PREFIX: "event:",
  ERROR_EVENT: "error",
});

export default SSE_RESPONSE_KEYS;
