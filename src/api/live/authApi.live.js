import {httpClient} from "@/api/clients/httpClient";
import {API_KEYS} from "@/constants/apiConfig";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";

export const authApiLive = {
  async checkLogin() {
    const response = await httpClient.get("/login.do", {
      apiKey: API_KEYS.LOGIN,
    });
    return response?.data || {};
  },

  async tempLogin(payload = {}) {
    const response = await httpClient.post("/temp-login.do", payload, {
      apiKey: API_KEYS.LOGIN,
    });
    return response?.data || {};
  },

  async getAccessInfo(payload = {}) {
    const response = await httpClient.post(API_ENDPOINTS.ACCESS_INFO, payload, {
      apiKey: API_KEYS.LOGIN,
    });
    return response?.data || {};
  },

  async logout() {
    const response = await httpClient.post("/logout.do", undefined, {
      apiKey: API_KEYS.LOGIN,
    });
    return response?.data || {};
  },
};
