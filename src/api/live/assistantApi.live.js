import {httpClient, unwrapResponseData} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

async function getAssistants() {
  const response = await httpClient.get(API_ENDPOINTS.ASSISTANT_INFO);

  return unwrapResponseData(response, []);
}
async function getStudios() {
  const response = await httpClient.get(API_ENDPOINTS.STUDIO_INFO);

  return unwrapResponseData(response, []);
}

export const assistantApiLive = {getAssistants, getStudios};
