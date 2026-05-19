import {httpClient} from "@/api/clients/httpClient";

export const authApiLive = {
  async checkLogin() {
    const response = await httpClient.get("/login.do");
    return response?.data || {};
  },

  async tempLogin(payload = {}) {
    const response = await httpClient.post("/temp-login.do", payload);
    return response?.data || {};
  },

  async logout() {
    const response = await httpClient.post("/logout.do");
    return response?.data || {};
  },
};
