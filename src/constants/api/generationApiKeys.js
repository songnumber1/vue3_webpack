/**
 * @file constants/api/generationApiKeys.js
 * @description generation.do 요청 payload 및 일반 generation 결과 원본 key 모음입니다.
 * SSE/OpenAI 호환 스트림 응답 전용 key는 sseResponseKeys.js에서 관리합니다.
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
  MODEL_ID_LEGACY: "modeId",
  INPUT: "input",
  BODY: "body",
  CONTENT: "content",
  ANSWER: "answer",
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
  STYLES: "styles",
  BYTE_SIZE: "byteSize",
  LAST_FEDERATION_INFO: "lastFederationInfo",
});

export default GENERATION_API_KEYS;
