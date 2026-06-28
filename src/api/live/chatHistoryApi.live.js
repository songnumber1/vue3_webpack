/**
 * @file api/live/chatHistoryApi.live.js
 * @description 실제 백엔드 API 호출 모듈입니다. mock API와 동일한 인터페이스를 유지해야 합니다.
 */

import {httpClient, unwrapResponseData} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {API_KEYS} from "@/constants/apiConfig";
import {unwrapApiBody} from "@/utils/apiResponseReader";

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
async function getChatHistoryList() {
  const response = await httpClient.get(API_ENDPOINTS.CHAT_HISTORY_LIST, {
    apiKey: API_KEYS.CHAT_HISTORY_SYNC,
  });
  return unwrapResponseData(response, []);
}

/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
async function createChat(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_NEW,
    payload,
    {apiKey: API_KEYS.CHAT_HISTORY_NEW}
  );
  return unwrapApiBody(response, {});
}

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
async function getChatHistoryDetail(payload = {}, options = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_DETAIL,
    payload,
    {signal: options.signal}
  );
  return unwrapResponseData(response, []);
}

/**
 * 현재 상태를 기준으로 reactive 값 또는 DOM 보조 값을 갱신합니다.
 */
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

/**
 * 현재 저장된 채팅방 제목/메시지 본문을 검색합니다.
 */

/**
 * 공유 URL로 진입한 대화방의 존재 여부와 조회 메시지를 검증합니다.
 */
async function getSharedConversation(payload = {}, options = {}) {
  const response = await httpClient.post(API_ENDPOINTS.SHARED_INFO, payload, {
    apiKey: API_KEYS.SHARED_INFO,
    signal: options.signal,
  });
  return unwrapResponseData(response, {});
}

async function searchChats(payload = {}) {
  const response = await httpClient.post(API_ENDPOINTS.CHAT_SEARCH, payload, {
    apiKey: API_KEYS.CHAT_HISTORY_SYNC,
  });
  return unwrapResponseData(response, []);
}

export const chatHistoryApiLive = {
  getChatHistoryList,
  createChat,
  getChatHistoryDetail,
  getSharedConversation,
  searchChats,
  updateBookmark,
  renameChat,
  deleteChat,
};
