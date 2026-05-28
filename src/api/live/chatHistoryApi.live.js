/**
 * @file api/live/chatHistoryApi.live.js
 * @description 실제 백엔드 API 호출 모듈입니다. mock API와 동일한 인터페이스를 유지해야 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {httpClient, unwrapResponseData} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {API_KEYS} from "@/constants/apiConfig";

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
  return response?.data?.data || response?.data || {};
}

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
async function getChatHistoryDetail(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_DETAIL,
    payload
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

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
async function renameChat(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_RENAME,
    payload
  );
  return unwrapResponseData(response, {});
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
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
