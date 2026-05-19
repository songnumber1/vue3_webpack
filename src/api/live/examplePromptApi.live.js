import {httpClient} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

async function getExamplePrompts(params = {}) {
  const response = await httpClient.get(API_ENDPOINTS.EXAMPLE_PROMPTS, {
    params,
  });

  return response?.data || {list: []};
}

export const examplePromptApiLive = {getExamplePrompts};
