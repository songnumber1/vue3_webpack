/**
 * @file api/live/promptTemplateApi.live.js
 * @description 실제 백엔드 API 호출 모듈입니다. mock API와 동일한 인터페이스를 유지해야 합니다.
 */

import {httpClient} from "@/api/clients/httpClient";
import {adaptGenericApiBody} from "@/adapters/assistantResponseAdapter";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
async function getPromptTemplates(params = {}) {
  const response = await httpClient.get(API_ENDPOINTS.PROMPT_TEMPLATES, {
    params,
  });

  return adaptGenericApiBody(response, {list: []});
}

export const promptTemplateApiLive = {getPromptTemplates};
