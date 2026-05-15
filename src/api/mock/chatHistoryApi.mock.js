/**
 * @file chatHistoryApi.mock.js
 * @description JavaScript module for chatHistoryApi.mock.
 */

import {CHAT_HISTORY_LIST_RAW} from "@/data/raw/chatHistoryList.raw";
import {CHAT_MESSAGES_RAW} from "@/data/raw/chatMessages.raw";
import {resolveMock} from "./mockUtils";

export const chatHistoryApiMock = {
  getChatHistoryList() {
    return resolveMock(CHAT_HISTORY_LIST_RAW, 210);
  },
  getChatHistoryDetail({chatId} = {}) {
    return resolveMock(CHAT_MESSAGES_RAW[chatId] || [], 180);
  },
};
