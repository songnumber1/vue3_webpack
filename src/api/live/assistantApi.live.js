/**
 * @file assistantApi.live.js
 * @description 운영 Assistant/Studio 목록 조회 Live API adapter입니다.
 */

import {httpClient} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

/**
 * Assistant 목록을 조회합니다.
 *
 * method: GET
 * payload: 없음
 * response: assist/info/assist.do response array
 *
 * @returns {Promise<Array<object>>} Assistant raw 목록입니다.
 */
async function getAssistants() {
  const response = await httpClient.get(API_ENDPOINTS.ASSISTANT_INFO);
  return response?.data || [];
}

/**
 * Studio Assistant 목록을 조회합니다.
 *
 * method: GET
 * payload: 없음
 * response: assist/info/studio.do response array
 *
 * @returns {Promise<Array<object>>} Studio raw 목록입니다.
 */
async function getStudios() {
  const response = await httpClient.get(API_ENDPOINTS.STUDIO_INFO);
  return response?.data || [];
}

export const assistantApiLive = {getAssistants, getStudios};
