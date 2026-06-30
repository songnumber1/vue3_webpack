import {httpClient, unwrapResponseData} from "@/api/clients/httpClient";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

async function createGenerationErrorMessages(payload = {}, cause = {}) {
  const response = await httpClient.post(API_ENDPOINTS.GENERATION_ERROR, {
    ...payload,
    errorCode: cause.code || cause.errorCode || "SSE_STREAM_ERROR",
    errorMessage: cause.message || cause.errorMessage || "",
  });
  return unwrapResponseData(response, []);
}

export const generationErrorApiLive = {
  createGenerationErrorMessages,
};

export default generationErrorApiLive;
