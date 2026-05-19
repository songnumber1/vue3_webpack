import axios from "axios";

export function createHttpClient() {
  return axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL || "/api",
    timeout: Number(process.env.VUE_APP_API_TIMEOUT || 15000),
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export const httpClient = createHttpClient();
