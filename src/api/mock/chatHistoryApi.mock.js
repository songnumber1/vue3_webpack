/**
 * @file api/mock/chatHistoryApi.mock.js
 * @description 개발/데모용 mock API 또는 mock 데이터입니다. 실제 API 비활성화 시 화면 동작을 보장합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {CHAT_API_KEYS as C} from "@/constants/api/chatApiKeys";
import {CHAT_HISTORY_LIST_RAW} from "@/api/mock/data/chatHistoryList.raw";
import {CHAT_MESSAGES_RAW} from "@/api/mock/data/chatMessages.raw";
import {CHAT_SEARCH_SUGGESTIONS_RAW} from "@/api/mock/data/chatSearchSuggestions.raw";
import {MODELS_RAW} from "@/api/mock/data/models.raw";
import {createId} from "@/utils/id";
import {resolveMock} from "./mockUtils";

const historyStore = CHAT_HISTORY_LIST_RAW.map((item) => ({...item}));
const messageStore = {...CHAT_MESSAGES_RAW};

/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createChatTitle(input) {
  const value = String(input || "").trim();
  if (!value) return "새 대화";
  return value.length > 20 ? value.slice(0, 20) : value;
}

function normalizeSharedIdValue(value) {
  const id = String(value || "").trim();
  return id || null;
}

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function buildMessageSearchText(chatId) {
  const messages = messageStore[chatId] || [];
  return messages
    .map((message) => String(message.content || message.answer || ""))
    .join(" ");
}

function findSearchTargetMessage(chatId, keyword = "") {
  const messages = messageStore[chatId] || [];
  const normalizedKeyword = normalizeSearchText(keyword);

  if (!normalizedKeyword) return null;

  return (
    messages.find((message) => {
      const content = String(message?.content || message?.answer || "").toLowerCase();
      return content.includes(normalizedKeyword);
    }) || null
  );
}

function createSearchSnippet(text, keyword, fallback = "") {
  const source = String(text || fallback || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!source) return "";
  const lower = source.toLowerCase();
  const index = keyword ? lower.indexOf(keyword) : -1;
  if (index < 0)
    return source.length > 120 ? `${source.slice(0, 120)}...` : source;
  const start = Math.max(0, index - 38);
  const end = Math.min(source.length, index + keyword.length + 72);
  return `${start > 0 ? "..." : ""}${source.slice(start, end)}${end < source.length ? "..." : ""}`;
}

function searchChatHistories(payload = {}) {
  const keyword = normalizeSearchText(
    payload.keyword || payload.searchText || payload.query
  );
  const limit = Math.max(1, Number(payload.limit || 30));
  const source = historyStore.map((history) => {
    const chatId = String(history[C.CHAT_ID] || "");
    const title = String(history[C.CHAT_TITLE] || "");
    const messageText = buildMessageSearchText(chatId);
    const combined = `${title} ${messageText}`.toLowerCase();
    const matched = !keyword || combined.includes(keyword);
    const targetMessage = matched ? findSearchTargetMessage(chatId, keyword) : null;
    return {history, chatId, title, messageText, matched, targetMessage};
  });

  return source
    .filter((item) => item.matched)
    .slice(0, limit)
    .map((item) => ({
      chatId: item.chatId,
      id: item.chatId,
      chatTitle: item.title,
      title: item.title,
      snippet: createSearchSnippet(item.messageText, keyword, item.title),
      preview: createSearchSnippet(item.messageText, keyword, item.title),
      messageId: item.targetMessage?.id || "",
      role: item.targetMessage?.role || "",
      chatEndDt: item.history[C.CHAT_END_DT] || "",
      sharedId: normalizeSharedIdValue(item.history[C.SHARED_ID] || item.history.sharedId),
      modelId:
        item.history[C.MODEL_ID] ||
        item.history[C.MODEL_ID_LEGACY] ||
        "",
      assistId: item.history.assistId || item.history.assistantId || "",
      bookmarkYN: item.history[C.BOOKMARK_YN],
      matchCount: keyword
        ? Math.max(1, item.messageText.toLowerCase().split(keyword).length - 1)
        : 0,
    }));
}

const SAMPLE_REASONING_CONTENTS = [
  `요청 내용을 먼저 Markdown 렌더링 기준으로 분해했습니다.

- 표는 GFM 테이블 처리 여부를 확인합니다.
- Mermaid는 렌더 후 SVG 변환 타이밍을 확인합니다.
- 코드, 링크, 이미지, 수식은 각각 renderer plugin 흐름을 점검합니다.`,
  `대화 이력을 불러온 뒤 assistant 메시지에 추론 내용이 있는 경우만 별도 영역으로 보여주도록 판단했습니다.

사용자에게는 최종 답변과 구분되는 보조 설명 영역으로 노출하는 것이 적절합니다.`,
  `모바일과 웹에서 동일한 컴포넌트를 사용하되, 글자 크기와 여백은 답변 본문보다 작게 유지하는 방향이 안전합니다.`,
];

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function shouldAttachReasoning(message, index) {
  if (message?.role !== "assistant") return false;
  if (message?.reasoningContent) return false;
  return Math.random() >= 0.45 || index === 1;
}

/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function isReasoningHistory(chatId) {
  const history = findHistory(chatId);
  const modelId = history?.modelId || history?.modeId || "";
  const model = MODELS_RAW.find((item) => item.modelId === modelId);

  return Boolean(model?.isReasoning);
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function attachMockReasoning(messages = [], chatId = "") {
  const isReasoning = isReasoningHistory(chatId);

  return messages.map((message, index) => {
    if (!isReasoning || !shouldAttachReasoning(message, index))
      return {...message};
    return {
      ...message,
      isReasoning: true,
      reasoningContent:
        SAMPLE_REASONING_CONTENTS[index % SAMPLE_REASONING_CONTENTS.length],
      reasoningStatus: "completed",
    };
  });
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function findHistory(chatId) {
  return historyStore.find(
    (item) => String(item[C.CHAT_ID]) === String(chatId)
  );
}

function findHistoryBySharedId(shareId) {
  const id = String(shareId || "").trim();
  if (!id) return null;
  return historyStore.find(
    (item) => String(item[C.SHARED_ID] || item.sharedId || "") === id
  );
}

function buildSharedConversationResponse(shareId) {
  const normalizedShareId = String(shareId || "").trim();
  const history = findHistoryBySharedId(normalizedShareId);

  if (!history) {
    return {
      success: false,
      exists: false,
      code: "SHARED_NOT_FOUND",
      message: "공유방을 찾을 수 없습니다.",
      shareId: normalizedShareId,
      messages: [],
    };
  }

  const chatId = String(history[C.CHAT_ID] || history.chatId || "");
  return {
    success: true,
    exists: true,
    shareId: normalizedShareId,
    chatId,
    title: history[C.CHAT_TITLE] || history.chatTitle || "",
    messages: attachMockReasoning(messageStore[chatId] || [], chatId),
  };
}

export const chatHistoryApiMock = {
  getChatHistoryList() {
    return resolveMock(historyStore, 210);
  },
  createChat(payload = {}) {
    const chatId = payload.chatId || createId();
    const modelId = payload.modelId || "";
    const assistantId = payload.assistId || payload.assistantId || "";
    const titleSource =
      payload.ChatTilte || payload.chatTitle || payload.input || "";
    const history = {
      chatTitle: createChatTitle(titleSource),
      chatId,
      modeId: modelId || "",
      modelId: modelId || "",
      assistId: assistantId || "",
      bookmarkYN: false,
      dayGroup: 0,
      chatEndDt: new Date().toISOString(),
      userId: "user-1234",
      sharedId: null,
    };
    historyStore.unshift(history);
    messageStore[chatId] = [];
    return resolveMock(history, 160);
  },
  getChatHistoryDetail({chatId} = {}) {
    return resolveMock(
      attachMockReasoning(messageStore[chatId] || [], chatId),
      180
    );
  },
  getSharedConversation({shareId} = {}) {
    return resolveMock(buildSharedConversationResponse(shareId), 180);
  },
  searchChats(payload = {}) {
    return resolveMock(
      {
        keyword: payload.keyword || payload.searchText || payload.query || "",
        suggestions: CHAT_SEARCH_SUGGESTIONS_RAW,
        list: searchChatHistories(payload),
      },
      180
    );
  },
  updateBookmark({chatId, bookmarkYN} = {}) {
    const target = findHistory(chatId);
    if (target) {
      target[C.BOOKMARK_YN] = Boolean(bookmarkYN);
      target[C.CHAT_END_DT] =
        target[C.CHAT_END_DT] || new Date().toISOString();
    }
    return resolveMock({success: true}, 140);
  },
  renameChat({chatId, chatTitle} = {}) {
    const target = findHistory(chatId);
    if (target && chatTitle) target[C.CHAT_TITLE] = chatTitle;
    return resolveMock({success: true}, 140);
  },
  deleteChat({chatId} = {}) {
    const index = historyStore.findIndex(
      (item) => String(item[C.CHAT_ID]) === String(chatId)
    );
    if (index >= 0) historyStore.splice(index, 1);
    return resolveMock({success: true}, 140);
  },
};
