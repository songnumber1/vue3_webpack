import axios from "axios";
import {shouldUseServerApi, SERVER_API_BASE_URL} from "@/constants/apiMode";

function resolveBaseURL() {
  if (shouldUseServerApi()) {
    return SERVER_API_BASE_URL;
  }

  return process.env.VUE_APP_API_BASE_URL || "/api";
}

export function createHttpClient() {
  return axios.create({
    baseURL: resolveBaseURL(),
    timeout: Number(process.env.VUE_APP_API_TIMEOUT || 15000),
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export const httpClient = createHttpClient();
