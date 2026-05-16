import {httpClient} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

/**
 * 좌측 대화 목록을 조회합니다.
 *
 * method: GET
 * payload: 없음
 * response: chat-history/list.do response array
 *
 * @returns {Promise<Array<object>>} 대화 목록 raw 응답입니다.
 */
async function getChatHistoryList() {
  const response = await httpClient.get(API_ENDPOINTS.CHAT_HISTORY_LIST);
  return response?.data || [];
}

/**
 * 특정 대화방의 메시지를 조회합니다.
 *
 * method: POST
 * payload: { chatId, assistId, modelId, studio }
 * response: chat-history/history.do response array
 *
 * @param {object} payload - 대화 상세 조회 payload입니다.
 * @returns {Promise<Array<object>>} 메시지 raw 응답입니다.
 */
async function getChatHistoryDetail(payload = {}) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_HISTORY_DETAIL,
    payload
  );
  return response?.data || [];
}

export const chatHistoryApiLive = {getChatHistoryList, getChatHistoryDetail};
