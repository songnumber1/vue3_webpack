import {CHAT_KEYS} from "@/constants/apiKeys";
import {CHAT_HISTORY_LIST_RAW} from "@/data/raw/chatHistoryList.raw";
import {CHAT_MESSAGES_RAW} from "@/data/raw/chatMessages.raw";
import {resolveMock} from "./mockUtils";

const historyStore = CHAT_HISTORY_LIST_RAW.map((item) => ({...item}));

const SAMPLE_REASONING_CONTENTS = [
  `요청 내용을 먼저 Markdown 렌더링 기준으로 분해했습니다.

- 표는 GFM 테이블 처리 여부를 확인합니다.
- Mermaid는 렌더 후 SVG 변환 타이밍을 확인합니다.
- 코드, 링크, 이미지, 수식은 각각 renderer plugin 흐름을 점검합니다.`,
  `대화 이력을 불러온 뒤 assistant 메시지에 추론 내용이 있는 경우만 별도 영역으로 보여주도록 판단했습니다.

사용자에게는 최종 답변과 구분되는 보조 설명 영역으로 노출하는 것이 적절합니다.`,
  `모바일과 웹에서 동일한 컴포넌트를 사용하되, 글자 크기와 여백은 답변 본문보다 작게 유지하는 방향이 안전합니다.`
];

function shouldAttachReasoning(message, index) {
  if (message?.role !== "assistant") return false;
  if (message?.reasoningContent) return false;
  return Math.random() >= 0.45 || index === 1;
}

function attachMockReasoning(messages = []) {
  return messages.map((message, index) => {
    if (!shouldAttachReasoning(message, index)) return {...message};
    return {
      ...message,
      reasoningContent:
        SAMPLE_REASONING_CONTENTS[index % SAMPLE_REASONING_CONTENTS.length],
      reasoningStatus: "completed",
    };
  });
}

function findHistory(chatId) {
  return historyStore.find(
    (item) => String(item[CHAT_KEYS.ID]) === String(chatId)
  );
}

export const chatHistoryApiMock = {
  getChatHistoryList() {
    return resolveMock(historyStore, 210);
  },
  getChatHistoryDetail({chatId} = {}) {
    return resolveMock(attachMockReasoning(CHAT_MESSAGES_RAW[chatId] || []), 180);
  },
  updateBookmark({chatId, bookmarkYN} = {}) {
    const target = findHistory(chatId);
    if (target) {
      target[CHAT_KEYS.BOOKMARK_YN] = Boolean(bookmarkYN);
      target[CHAT_KEYS.ENDED_AT] =
        target[CHAT_KEYS.ENDED_AT] || new Date().toISOString();
    }
    return resolveMock({success: true}, 140);
  },
  renameChat({chatId, chatTitle} = {}) {
    const target = findHistory(chatId);
    if (target && chatTitle) target[CHAT_KEYS.TITLE] = chatTitle;
    return resolveMock({success: true}, 140);
  },
  deleteChat({chatId} = {}) {
    const index = historyStore.findIndex(
      (item) => String(item[CHAT_KEYS.ID]) === String(chatId)
    );
    if (index >= 0) historyStore.splice(index, 1);
    return resolveMock({success: true}, 140);
  },
};
