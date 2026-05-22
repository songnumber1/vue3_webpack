import {httpClient, unwrapResponseData} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

async function getPromptTemplates(params = {}) {
  const response = await httpClient.get(API_ENDPOINTS.PROMPT_TEMPLATES, {
    params,
  });

  return unwrapResponseData(response, {list: []});
}

export const promptTemplateApiLive = {getPromptTemplates};
