/**
 * @file apiKeys.js
 * @description JavaScript module for apiKeys.
 */

export const ASSISTANT_KEYS = Object.freeze({
  ID: 'assistId',
  NAME: 'assistName',
  ORDER: 'assistOrder',
  STUDIO_YN: 'studioYN',
  RAG_YN: 'ragYN',
  AUTH_YN: 'authYN',
  DELETE_YN: 'delYN',
  PRIVATE_YN: 'privateYN',
  FIX_YN: 'fixYN',
})

export const MODEL_KEYS = Object.freeze({
  ID: 'modelId',
  NAME: 'modelName',
  TYPE: 'ModelType',
  ASSISTANT_ID: 'assistId',
  ORDER: 'modelOrder',
  AUTH_YN: 'authYN',
  DELETE_YN: 'delYN',
})

export const CHAT_KEYS = Object.freeze({
  ID: 'chatId',
  TITLE: 'chatTitle',
  MODEL_ID: 'modelId',
  LEGACY_MODEL_ID: 'modeId',
  BOOKMARK_YN: 'bookmarkYN',
  ENDED_AT: 'chatEndDt',
  USER_ID: 'userId',
})

export const MESSAGE_KEYS = Object.freeze({
  ID: 'id',
  ROLE: 'role',
  CONTENT: 'content',
  SENT_AT: 'sendTime',
  REFERENCES: 'references',
  LEGACY_REFERENCES: 'refreences',
})
