import {httpClient, unwrapResponseData} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

async function getChatHistoryList() {
  const response = await httpClient.get(API_ENDPOINTS.CHAT_HISTORY_LIST);
  return unwrapResponseData(response, []);
}

async function createChat(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_NEW,
    payload
  );
  return response?.data?.data || response?.data || {};
}

async function getChatHistoryDetail(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_DETAIL,
    payload
  );
  return unwrapResponseData(response, []);
}

async function updateBookmark(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_BOOKMARK,
    payload
  );
  return unwrapResponseData(response, {});
}

async function renameChat(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_RENAME,
    payload
  );
  return unwrapResponseData(response, {});
}

async function deleteChat(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_DELETE,
    payload
  );
  return unwrapResponseData(response, {});
}

export const chatHistoryApiLive = {
  getChatHistoryList,
  createChat,
  getChatHistoryDetail,
  updateBookmark,
  renameChat,
  deleteChat,
};
