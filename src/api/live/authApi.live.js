import {httpClient} from "@/api/clients/httpClient";
import {API_KEYS} from "@/constants/apiConfig";

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

  async logout() {
    const response = await httpClient.post("/logout.do", undefined, {
      apiKey: API_KEYS.LOGIN,
    });
    return response?.data || {};
  },
};
