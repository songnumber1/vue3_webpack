import {httpClient} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

async function getAssistants() {
  const response = await httpClient.get(API_ENDPOINTS.ASSISTANT_INFO);

  return response?.data || [];
}
async function getStudios() {
  const response = await httpClient.get(API_ENDPOINTS.STUDIO_INFO);

  return response?.data || [];
}

export const assistantApiLive = {getAssistants, getStudios};
