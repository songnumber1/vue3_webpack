/**
 * @file constants/api/messageApiKeys.js
 * @description 채팅 메시지/참조/추론 상태 API 원본 key 모음입니다.
 */

export const MESSAGE_API_KEYS = Object.freeze({
  ID: "id",
  MESSAGE_ID: "msgId",
  RESPONSE_MESSAGE_ID: "respMsgId",
  ROLE: "role",
  CONTENT: "content",
  ANSWER: "answer",
  SENT_AT: "sendTime",
  STATUS: "status",
  TYPE: "type",
  REFERENCES: "references",
  REFERENCES_LEGACY_TYPO: "refreences",
  DUO: "duo",
  RAG_IMAGE: "ragimage",
  RAG_IMAGE_CAMEL: "ragImage",
  RAG_IMAGES: "ragimages",
  RAG_IMAGES_SNAKE: "rag_images",
  REASONING_CONTENT: "reasoningContent",
  REASONING_CONTENT_SNAKE: "reasoning_content",
  REASONING: "reasoning",
  REASON_CONTENT: "reasonContent",
  REASONING_STATUS: "reasoningStatus",
  IS_REASONING: "isReasoning",
  ATTACHMENTS: "attachments",
  FILES: "files",
  NAME: "name",
  URL: "url",
  SOURCE: "source",
  SOURCE_OPTIONS: "sourceOptions",
  EXTERNAL_OPTIONS: "externalOptions",
});

export default MESSAGE_API_KEYS;
