/**
 * @file adapters/messageResponseAdapter.js
 * @description Chat message 원본 API/mock 응답을 프론트 내부 메시지 모델로 정규화합니다.
 */

import {MESSAGE_API_KEYS as M} from "@/constants/api/messageApiKeys";
import {API_RESPONSE_KEYS as R} from "@/constants/api/apiResponseKeys";
import {MESSAGE_ROLES} from "@/constants/domain";
import {toBoolean} from "@/utils/booleanUtils";
import {readApiList} from "@/utils/apiResponseReader";

function firstText(...values) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim() !== ""
  );
  return found || "";
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function readArray(...values) {
  const found = values.find(Array.isArray);
  return found || [];
}

function normalizeRole(value) {
  return value === MESSAGE_ROLES.USER
    ? MESSAGE_ROLES.USER
    : MESSAGE_ROLES.ASSISTANT;
}

/**
 * 단일 메시지 원본 응답을 기존 화면 모델 규격으로 정규화합니다.
 * legacy/snake_case/camelCase fallback은 제거하지 않고 이 adapter 안에서 흡수합니다.
 */
export function adaptMessageItem(raw = {}) {
  const reasoningContent = firstText(
    raw[M.REASONING_CONTENT],
    raw[M.REASONING_CONTENT_SNAKE],
    raw[M.REASONING],
    raw[M.REASON_CONTENT]
  );
  const content = firstText(
    raw[M.CONTENT],
    raw[M.ANSWER],
    raw[R.BODY],
    reasoningContent
  );
  const status = firstDefined(raw[M.STATUS], raw[R.STATUS]);
  const error = raw[R.ERROR] === true || status === "error";

  return {
    id: firstDefined(raw[M.ID], raw[M.MESSAGE_ID], raw[M.RESPONSE_MESSAGE_ID]),
    role: normalizeRole(raw[M.ROLE]),
    content,
    status: status || (error ? "error" : "complete"),
    error,
    errorTitle: firstText(raw.errorTitle, raw.error_title),
    errorMessage: firstText(
      raw.errorMessage,
      raw.error_message,
      raw[R.ERROR_MESSAGE]
    ),
    errorCode: firstText(raw.errorCode, raw.error_code, raw.code),
    reasoningContent,
    reasoningStatus:
      raw[M.REASONING_STATUS] || (reasoningContent ? "completed" : ""),
    isReasoning: toBoolean(raw[M.IS_REASONING]) || Boolean(reasoningContent),
    createdAt: raw[M.SENT_AT] || "",
    isSent: toBoolean(raw.isSend),
    isRag: toBoolean(raw.isRAG),
    isRagCot: toBoolean(raw.isRagCot),
    intention: raw.intention || null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    references: readArray(raw[M.REFERENCES], raw[M.REFERENCES_LEGACY_TYPO]),
    duo: readArray(raw[M.DUO]),
    ragimage: readArray(
      raw[M.RAG_IMAGE],
      raw[M.RAG_IMAGE_CAMEL],
      raw[M.RAG_IMAGES],
      raw[M.RAG_IMAGES_SNAKE]
    ),
    raw,
  };
}

/**
 * 메시지 목록 원본 응답을 기존 타임라인 정렬 규칙으로 정규화합니다.
 */
export function adaptMessageList(rawItems = []) {
  return readApiList(rawItems, rawItems)
    .map(adaptMessageItem)
    .filter((item) => item.id && item.content !== undefined)
    .sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime()
    );
}

export default {
  adaptMessageItem,
  adaptMessageList,
};
