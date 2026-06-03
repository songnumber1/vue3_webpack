/**
 * @file adapters/chatResponseAdapter.js
 * @description Chat history/search 원본 API/mock 응답을 프론트 내부 채팅 모델로 정규화합니다.
 */

import {CHAT_API_KEYS as C} from "@/constants/api/chatApiKeys";
import {API_RESPONSE_KEYS as R} from "@/constants/api/apiResponseKeys";
import {toBoolean} from "@/utils/booleanUtils";
import {readApiList, unwrapApiBody} from "@/utils/apiResponseReader";

function firstText(...values) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim() !== ""
  );
  return found || "";
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function resolveModelId(raw = {}) {
  return firstText(raw[C.MODEL_ID], raw[C.MODEL_ID_LEGACY]);
}

function resolveAssistantId(raw = {}, model = null) {
  return firstText(raw[C.ASSIST_ID], raw[C.ASSISTANT_ID], model?.assistId);
}

function resolveTitle(raw = {}, fallbackTitle = "새 대화") {
  return (
    firstText(raw[C.CHAT_TITLE], raw[C.CHAT_TITLE_LEGACY_TYPO], raw[C.TITLE]) ||
    fallbackTitle
  );
}

/**
 * 채팅방 목록/생성 응답 단일 item을 기존 history 모델로 정규화합니다.
 */
export function adaptChatHistoryItem(raw = {}, context = {}) {
  const modelId = resolveModelId(raw);
  const model = context.modelMap?.[modelId] || null;
  const assistantId = resolveAssistantId(raw, model);
  const assistant = assistantId
    ? context.assistantMap?.[assistantId] || null
    : null;
  const title = resolveTitle(raw);

  return {
    id: firstText(raw[C.CHAT_ID], raw.id),
    title,
    preview:
      title || firstText(raw[C.PREVIEW], raw[C.SNIPPET]) || "저장된 대화",
    modelId,
    assistantId: assistantId || null,
    assistantType: assistant?.type || null,
    assistantLabel: assistant?.label || "",
    modelLabel: model?.label || "",
    isPinned: toBoolean(raw[C.BOOKMARK_YN]),
    endedAt: raw[C.CHAT_END_DT] || "",
    userId: raw[C.USER_ID] || "",
    raw,
  };
}

/**
 * 채팅방 목록 응답 전체를 기존 정렬 규칙으로 정규화합니다.
 */
export function adaptChatHistoryList(rawItems = [], context = {}) {
  return readApiList(rawItems, rawItems)
    .map((item) => adaptChatHistoryItem(item, context))
    .filter((item) => item.id)
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return (
        new Date(b.endedAt || 0).getTime() - new Date(a.endedAt || 0).getTime()
      );
    });
}

/**
 * 검색 결과 단일 item을 ChatSearchWorkspace에서 쓰는 기존 모델로 정규화합니다.
 */
export function adaptChatSearchItem(raw = {}, options = {}) {
  const fallbackTitle = options.fallbackTitle || "";
  const chatId = firstText(raw[C.CHAT_ID], raw.id);
  const title = firstText(raw[C.TITLE], raw[C.CHAT_TITLE]) || fallbackTitle;
  const snippet = firstText(raw[C.SNIPPET], raw[C.PREVIEW], raw.summary);
  const endedAt = firstText(raw[C.CHAT_END_DT], raw.endedAt, raw.updatedAt);

  return {
    ...raw,
    chatId,
    id: firstText(raw.id, chatId),
    title,
    chatTitle: firstText(raw[C.CHAT_TITLE], raw[C.TITLE]) || fallbackTitle,
    snippet,
    preview: firstText(raw[C.PREVIEW], raw[C.SNIPPET], raw.summary),
    chatEndDt: endedAt,
    modelId: firstText(raw[C.MODEL_ID], raw[C.MODEL_ID_LEGACY]),
    modeId: raw[C.MODEL_ID_LEGACY],
    assistId: firstText(raw[C.ASSIST_ID], raw[C.ASSISTANT_ID]),
    assistantId: firstText(raw[C.ASSISTANT_ID], raw[C.ASSIST_ID]),
    bookmarkYN: firstDefined(raw[C.BOOKMARK_YN], raw.isPinned),
    matchCount: Number(raw[C.MATCH_COUNT] || 0),
  };
}

export function adaptChatSearchList(rawItems = [], options = {}) {
  return readApiList(rawItems, rawItems)
    .filter(Boolean)
    .map((item) => adaptChatSearchItem(item, options));
}

/**
 * search API wrapper 응답을 {list, keyword, suggestions} 형태로 정규화합니다.
 */
export function adaptChatSearchResponse(response, options = {}) {
  const body = unwrapApiBody(response, response);
  const source = body && typeof body === "object" ? body : response;
  const listSource = Array.isArray(source) ? source : source?.[R.LIST] || [];

  return {
    keyword: source?.[R.KEYWORD] || options.keyword || "",
    suggestions: Array.isArray(source?.[R.SUGGESTIONS])
      ? source[R.SUGGESTIONS]
      : [],
    list: adaptChatSearchList(listSource, options),
  };
}

/**
 * 검색 결과 클릭 시 store에 임시 history를 추가하기 위한 기존 history 모델을 만듭니다.
 */
export function createHistoryFromSearchResult(result = {}, options = {}) {
  const fallbackTitle = options.fallbackTitle || "새 대화";
  const chatId = firstText(result.chatId, result.id);
  const title = firstText(result.title, result.chatTitle) || fallbackTitle;
  const endedAt = firstText(result.chatEndDt, result.endedAt, result.updatedAt);

  return {
    id: chatId,
    title,
    preview: firstText(
      result.snippet,
      result.preview,
      result.title,
      result.chatTitle
    ),
    modelId: firstText(result.modelId, result.modeId),
    assistantId: firstText(result.assistId, result.assistantId),
    assistantType: result.assistantType || "",
    assistantLabel: result.assistantLabel || "",
    modelLabel: result.modelLabel || "",
    isPinned: Boolean(result.isPinned || result.bookmarkYN),
    endedAt: endedAt || new Date().toISOString(),
    userId: result.userId || "",
    raw: {
      ...result,
      chatId,
      chatTitle: firstText(result.chatTitle, result.title) || fallbackTitle,
      chatEndDt: endedAt,
    },
  };
}

export default {
  adaptChatHistoryItem,
  adaptChatHistoryList,
  adaptChatSearchItem,
  adaptChatSearchList,
  adaptChatSearchResponse,
  createHistoryFromSearchResult,
};
