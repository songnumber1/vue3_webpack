import {CHAT_HISTORY_LIST_RAW} from "@/data/raw/chatHistoryList.raw";
import {CHAT_MESSAGES_RAW} from "@/data/raw/chatMessages.raw";
import {resolveMock} from "./mockUtils";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
export const chatHistoryApiMock = {
  getChatHistoryList() {
    // 계산된 결과를 호출부로 반환합니다.
    return resolveMock(CHAT_HISTORY_LIST_RAW, 210);
  },
  getChatHistoryDetail({chatId} = {}) {
    // 계산된 결과를 호출부로 반환합니다.
    return resolveMock(CHAT_MESSAGES_RAW[chatId] || [], 180);
  },
};
