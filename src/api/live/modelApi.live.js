/**
 * @file modelApi.live.js
 * @description 운영 Assistant/Studio 모델 목록 조회 Live API adapter입니다.
 */

import { httpClient } from '@/api/clients/httpClient'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

/**
 * 일반 Assistant 모델 목록을 조회합니다.
 *
 * method: GET
 * payload: 없음
 * response: model/info/model.do response array
 *
 * @returns {Promise<Array<object>>} 모델 raw 목록입니다.
 */
async function getModels() {
  const response = await httpClient.get(API_ENDPOINTS.MODEL_INFO)
  return response?.data || []
}

/**
 * Studio Assistant 모델 목록을 조회합니다.
 *
 * method: GET
 * payload: 없음
 * response: model/info/studio-model.do response array
 *
 * @returns {Promise<Array<object>>} Studio 모델 raw 목록입니다.
 */
async function getStudioModels() {
  const response = await httpClient.get(API_ENDPOINTS.STUDIO_MODEL_INFO)
  return response?.data || []
}

export const modelApiLive = { getModels, getStudioModels }
