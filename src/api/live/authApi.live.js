/**
 * @file api/live/authApi.live.js
 * @description 실제 백엔드 API 호출 모듈입니다. mock API와 동일한 인터페이스를 유지해야 합니다.
 */

import {httpClient} from "@/api/clients/httpClient";
import {API_KEYS} from "@/constants/apiConfig";
import {resolveSessionAuthConfig} from "@/auth/authPolicy";
import {adaptAuthApiResponse} from "@/adapters/authResponseAdapter";

export const authApiLive = {
  async checkLogin() {
    const response = await httpClient.get(resolveSessionAuthConfig().loginUrl, {
      apiKey: API_KEYS.LOGIN,
    });
    return adaptAuthApiResponse(response);
  },

  async tempLogin(payload = {}) {
    const response = await httpClient.post(
      resolveSessionAuthConfig().tempLoginUrl,
      payload,
      {
        apiKey: API_KEYS.LOGIN,
      }
    );
    return adaptAuthApiResponse(response);
  },

  async logout() {
    const response = await httpClient.post(
      resolveSessionAuthConfig().logoutUrl,
      undefined,
      {
        apiKey: API_KEYS.LOGIN,
      }
    );
    return adaptAuthApiResponse(response);
  },
};
