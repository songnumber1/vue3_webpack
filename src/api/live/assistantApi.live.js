/**
 * @file api/live/assistantApi.live.js
 * @description 실제 백엔드 API 호출 모듈입니다. mock API와 동일한 인터페이스를 유지해야 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {httpClient} from "@/api/clients/httpClient";
import {adaptGenericApiList} from "@/adapters/assistantResponseAdapter";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
async function getAssistants() {
  const response = await httpClient.get(API_ENDPOINTS.ASSISTANT_INFO);

  return adaptGenericApiList(response, []);
}
/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
async function getStudios() {
  const response = await httpClient.get(API_ENDPOINTS.STUDIO_INFO);

  return adaptGenericApiList(response, []);
}

export const assistantApiLive = {getAssistants, getStudios};
