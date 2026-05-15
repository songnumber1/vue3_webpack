/**
 * @file accessApi.live.js
 * @description 운영 access/info.do API를 호출하는 Live API adapter입니다.
 */

import {httpClient} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

/**
 * 사용자 로그인/권한/동의 정보를 조회합니다.
 *
 * method: POST
 * payload: { language, entryType, shareId, chatId, msgId, studioId }
 * response: access/info.do response body
 * 특징: 라우터 가드와 runtime bootstrap에서 같은 endpoint를 사용하도록 Live API를 분리합니다.
 *
 * @param {object} payload - access/info.do 요청 payload입니다.
 * @returns {Promise<object>} 사용자 접근 정보 응답입니다.
 */
export async function getAccessInfo(payload = {}) {
  const response = await httpClient.post(API_ENDPOINTS.ACCESS_INFO, payload);
  return response?.data || {};
}

export const accessApiLive = {getAccessInfo};
