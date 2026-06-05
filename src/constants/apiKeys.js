/**
 * @file constants/apiKeys.js
 * @description legacy API key import 호환 레이어입니다.
 *
 * 신규 코드는 src/constants/api/*ApiKeys.js를 직접 사용하세요.
 * 이 파일은 기존 import가 남아 있는 외부/레거시 코드의 런타임 호환만 보장합니다.
 */

import {ASSISTANT_API_KEYS} from "@/constants/api/assistantApiKeys";
import {MODEL_API_KEYS} from "@/constants/api/modelApiKeys";
import {CHAT_API_KEYS} from "@/constants/api/chatApiKeys";
import {MESSAGE_API_KEYS} from "@/constants/api/messageApiKeys";

export const ASSISTANT_KEYS = ASSISTANT_API_KEYS;
export const MODEL_KEYS = MODEL_API_KEYS;

export const CHAT_KEYS = Object.freeze({
  ID: CHAT_API_KEYS.CHAT_ID,
  TITLE: CHAT_API_KEYS.CHAT_TITLE,
  MODEL_ID: CHAT_API_KEYS.MODEL_ID,
  LEGACY_MODEL_ID: CHAT_API_KEYS.MODEL_ID_LEGACY,
  BOOKMARK_YN: CHAT_API_KEYS.BOOKMARK_YN,
  ENDED_AT: CHAT_API_KEYS.CHAT_END_DT,
  USER_ID: CHAT_API_KEYS.USER_ID,
  SHARED_ID: CHAT_API_KEYS.SHARED_ID,
});

export const MESSAGE_KEYS = Object.freeze({
  ID: MESSAGE_API_KEYS.ID,
  ROLE: MESSAGE_API_KEYS.ROLE,
  CONTENT: MESSAGE_API_KEYS.CONTENT,
  SENT_AT: MESSAGE_API_KEYS.SENT_AT,
  REFERENCES: MESSAGE_API_KEYS.REFERENCES,
  LEGACY_REFERENCES: MESSAGE_API_KEYS.REFERENCES_LEGACY_TYPO,
  REASONING_CONTENT: MESSAGE_API_KEYS.REASONING_CONTENT,
  REASONING_STATUS: MESSAGE_API_KEYS.REASONING_STATUS,
});
