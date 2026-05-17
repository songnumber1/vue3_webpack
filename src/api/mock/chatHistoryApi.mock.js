import {CHAT_KEYS} from '@/constants/apiKeys';
import {CHAT_HISTORY_LIST_RAW} from '@/data/raw/chatHistoryList.raw';
import {CHAT_MESSAGES_RAW} from '@/data/raw/chatMessages.raw';
import {resolveMock} from './mockUtils';

const historyStore = CHAT_HISTORY_LIST_RAW.map((item) => ({...item}));

function findHistory(chatId) {
  return historyStore.find((item) => String(item[CHAT_KEYS.ID]) === String(chatId));
}

export const chatHistoryApiMock = {
  getChatHistoryList() {
    return resolveMock(historyStore, 210);
  },
  getChatHistoryDetail({chatId} = {}) {
    return resolveMock(CHAT_MESSAGES_RAW[chatId] || [], 180);
  },
  updateBookmark({chatId, bookmarkYN} = {}) {
    const target = findHistory(chatId);
    if (target) {
      target[CHAT_KEYS.BOOKMARK_YN] = Boolean(bookmarkYN);
      target[CHAT_KEYS.ENDED_AT] = target[CHAT_KEYS.ENDED_AT] || new Date().toISOString();
    }
    return resolveMock({success: true}, 140);
  },
  renameChat({chatId, chatTitle} = {}) {
    const target = findHistory(chatId);
    if (target && chatTitle) target[CHAT_KEYS.TITLE] = chatTitle;
    return resolveMock({success: true}, 140);
  },
  deleteChat({chatId} = {}) {
    const index = historyStore.findIndex((item) => String(item[CHAT_KEYS.ID]) === String(chatId));
    if (index >= 0) historyStore.splice(index, 1);
    return resolveMock({success: true}, 140);
  },
};
