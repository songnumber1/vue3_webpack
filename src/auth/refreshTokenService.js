import axios from "axios";
import {
  DEFAULT_API_BASE_PATH,
  SERVER_API_BASE_URL,
  shouldUseServerApi,
} from "@/constants/apiMode";
import {resolveAuthPolicy} from "@/auth/authPolicy";
import {getRefreshToken, setTokens, clearTokens} from "@/auth/tokenStore";
import {AUTH_HEADER_NAMES, AUTH_MODES} from "@/auth/authConstants";
import {AUTH_API_KEYS as A} from "@/constants/api/authApiKeys";
import {adaptAuthTokens} from "@/adapters/authResponseAdapter";
import {useAuthStore} from "@/stores/authStore";
import {resetAppBootstrapState} from "@/composables/app/useAppBootstrap";

let refreshPromise = null;

function resolveBaseURL() {
  return shouldUseServerApi()
    ? SERVER_API_BASE_URL
    : process.env.VUE_APP_API_BASE_URL || DEFAULT_API_BASE_PATH;
}

function createRefreshClient() {
  return axios.create({
    baseURL: resolveBaseURL(),
    timeout: Number(process.env.VUE_APP_AUTH_TIMEOUT || 15000),
    withCredentials: false,
    headers: {"Content-Type": "application/json"},
  });
}

export async function refreshAccessTokenOnce() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const policy = resolveAuthPolicy();
    const refreshToken = getRefreshToken();
    if (!policy.isJwt || !refreshToken) {
      throw new Error("Refresh token is not available.");
    }

    const client = createRefreshClient();
    const response = await client.post(
      policy.refreshUrl,
      {[A.REFRESH_TOKEN]: refreshToken},
      {
        headers: {
          [AUTH_HEADER_NAMES.CLIENT_PLATFORM]: policy.platform,
          [AUTH_HEADER_NAMES.AUTH_MODE]: AUTH_MODES.JWT,
        },
      }
    );
    const {accessToken, refreshToken: nextRefreshToken} = adaptAuthTokens(
      response,
      refreshToken
    );
    if (!accessToken) throw new Error("Refresh response has no access token.");
    setTokens({accessToken, refreshToken: nextRefreshToken});
    return accessToken;
  })();

  try {
    return await refreshPromise;
  } catch (error) {
    clearTokens();
    resetAppBootstrapState();
    try {
      useAuthStore().resetAuth();
    } catch (_storeError) {
      // 인증 스토어가 아직 초기화되지 않은 부트스트랩 구간에서는 토큰만 정리합니다.
    }
    throw error;
  } finally {
    refreshPromise = null;
  }
}
