import {httpClient, unwrapResponseData} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

export async function getAccessInfo(payload = {}) {
  const response = await httpClient.post(API_ENDPOINTS.ACCESS_INFO, payload);

  return unwrapResponseData(response, {});
}

export const accessApiLive = {getAccessInfo};
