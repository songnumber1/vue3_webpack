import {httpClient} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

async function getModels() {
  const response = await httpClient.get(API_ENDPOINTS.MODEL_INFO);

  return response?.data || [];
}
async function getStudioModels() {
  const response = await httpClient.get(API_ENDPOINTS.STUDIO_MODEL_INFO);

  return response?.data || [];
}

export const modelApiLive = {getModels, getStudioModels};
