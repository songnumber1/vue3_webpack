/**
 * @file constants/api/generationApiKeys.js
 * @description generation.do 요청/결과 및 생성 상태 API 원본 key 모음입니다.
 */

export const GENERATION_API_KEYS = Object.freeze({
  REQUEST_ID: "requestId",
  REQUEST_ID_SNAKE: "request_id",
  CHAT_ID: "chatId",
  MESSAGE_ID: "msgId",
  RESPONSE_MESSAGE_ID: "respMsgId",
  ASSIST_ID: "assistId",
  ASSISTANT_ID: "assistantId",
  MODEL_ID: "modelId",
  INPUT: "input",
  BODY: "body",
  CONTENT: "content",
  IS_REASONING: "isReasoning",
  STUDIO: "studio",
  INTENTION: "intention",
  RAG: "rag",
  RAG_COT: "ragCot",
  IMAGE_S3_PATH: "imageS3Path",
  IMAGE_S3_PATH_LEGACY: "imgS3Path",
  SOURCE_TYPE: "sourceType",
  ARRAY_OPTIONS: "arrayOptions",
  MESSAGE_FILE_HISTORY: "messageFileHist",
  UI_STATE_INFO_WRAPPER: "uiStateInfoWrapper",
  DELTA: "delta",
  CHOICES: "choices",
  FINISH_REASON: "finish_reason",
  INDEX: "index",
  LOGPROBS: "logprobs",
  TOKEN_IDS: "token_ids",
  CREATED: "created",
  MODEL: "model",
  OBJECT: "object",
  SERVICE_TIER: "service_tier",
  SYSTEM_FINGERPRINT: "system_fingerprint",
  USAGE: "usage",
});

export default GENERATION_API_KEYS;
