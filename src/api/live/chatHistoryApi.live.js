import {httpClient} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

async function getChatHistoryList() {
  const response = await httpClient.get(API_ENDPOINTS.CHAT_HISTORY_LIST);
  return response?.data || [];
}

async function getChatHistoryDetail(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_DETAIL,
    payload
  );
  return response?.data || [];
}

async function updateBookmark(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_BOOKMARK,
    payload
  );
  return response?.data || {};
}

async function renameChat(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_RENAME,
    payload
  );
  return response?.data || {};
}

async function deleteChat(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_DELETE,
    payload
  );
  return response?.data || {};
}

export const chatHistoryApiLive = {
  getChatHistoryList,
  getChatHistoryDetail,
  updateBookmark,
  renameChat,
  deleteChat,
};
