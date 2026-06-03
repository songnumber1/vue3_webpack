/**
 * @file api/live/authApi.live.js
 * @description 실제 백엔드 API 호출 모듈입니다. mock API와 동일한 인터페이스를 유지해야 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {httpClient} from "@/api/clients/httpClient";
import {API_KEYS} from "@/constants/apiConfig";
import {resolveAuthPolicy} from "@/auth/authPolicy";
import {setTokens, clearTokens} from "@/auth/tokenStore";
import {adaptAuthApiResponse, adaptAuthTokens} from "@/adapters/authResponseAdapter";

export const authApiLive = {
  async checkLogin() {
    const response = await httpClient.get(resolveAuthPolicy().loginUrl, {
      apiKey: API_KEYS.LOGIN,
    });
    return adaptAuthApiResponse(response);
  },

  async tempLogin(payload = {}) {
    const response = await httpClient.post(
      resolveAuthPolicy().tempLoginUrl,
      payload,
      {
        apiKey: API_KEYS.LOGIN,
      }
    );
    const data = adaptAuthApiResponse(response);
    const tokens = adaptAuthTokens(data);
    setTokens(tokens);
    return data;
  },

  async logout() {
    try {
      const response = await httpClient.post(
        resolveAuthPolicy().logoutUrl,
        undefined,
        {
          apiKey: API_KEYS.LOGIN,
        }
      );
      return adaptAuthApiResponse(response);
    } finally {
      clearTokens();
    }
  },
};
