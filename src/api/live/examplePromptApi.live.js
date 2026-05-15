/**
 * @file examplePromptApi.live.js
 * @description 운영 example prompt 조회 Live API adapter입니다.
 */

import { httpClient } from '@/api/clients/httpClient'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

/**
 * Assistant 또는 Studio에 연결된 예시 프롬프트를 조회합니다.
 *
 * method: GET
 * payload: { assistId, studioYN }
 * response: { list: Array<object> }
 * 특징: API 키는 운영 백엔드 구조를 유지하고 adapter에서 UI ViewModel로 변환합니다.
 *
 * @param {object} params - 조회 파라미터입니다.
 * @param {string} params.assistId - Assistant 또는 Studio ID입니다.
 * @param {boolean} [params.studioYN=false] - Studio 여부입니다.
 * @returns {Promise<object>} 예시 프롬프트 raw 응답입니다.
 */
async function getExamplePrompts(params = {}) {
  const response = await httpClient.get(API_ENDPOINTS.EXAMPLE_PROMPTS, { params })
  return response?.data || { list: [] }
}

export const examplePromptApiLive = { getExamplePrompts }
