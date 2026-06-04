import {resolveAuthPolicy, isAuthPublicUrl} from "@/auth/authPolicy";
import {AUTH_HEADER_NAMES} from "@/auth/authConstants";
import {getAccessToken, clearTokens} from "@/auth/tokenStore";
import {refreshAccessTokenOnce} from "@/auth/refreshTokenService";
import {useAuthStore} from "@/stores/authStore";

function ensureHeaders(config) {
  config.headers = config.headers || {};
  return config.headers;
}

export function applyAuthRequestConfig(config = {}) {
  const policy = resolveAuthPolicy();
  const headers = ensureHeaders(config);

  config.withCredentials = policy.withCredentials;
  headers[AUTH_HEADER_NAMES.CLIENT_PLATFORM] = policy.platform;
  headers[AUTH_HEADER_NAMES.AUTH_MODE] = policy.authMode;

  if (policy.isJwt && !isAuthPublicUrl(config.url)) {
    const token = getAccessToken();
    if (token) headers[AUTH_HEADER_NAMES.AUTHORIZATION] = `Bearer ${token}`;
  }

  return config;
}

export function isAuthExpiredStatus(status) {
  return status === 401 || status === 403;
}

function shouldResetAuthForError(error) {
  const status = error?.response?.status;
  const config = error?.config || {};
  if (!isAuthExpiredStatus(status)) return false;
  if (isAuthPublicUrl(config.url)) return false;
  return true;
}

export function shouldTryRefresh(error) {
  const status = error?.response?.status;
  const config = error?.config || {};
  // JWT refresh는 access token 만료를 의미하는 401에서만 수행합니다.
  // 백엔드 세션 인터셉터가 내려주는 403은 refresh 재시도 없이 인증 상태를 정리합니다.
  if (status !== 401) return false;
  if (config.__authRetry) return false;
  if (config.signal?.aborted) return false;
  if (isAuthPublicUrl(config.url)) return false;
  return resolveAuthPolicy().isJwt;
}

function cleanupRetryConfig(config, accessToken) {
  const nextConfig = {...config};
  nextConfig.headers = {...(config.headers || {})};
  nextConfig.__authRetry = true;
  delete nextConfig.signal;
  delete nextConfig.__apiRequestKey;
  delete nextConfig.__apiOverlay;
  nextConfig.headers[AUTH_HEADER_NAMES.AUTHORIZATION] = `Bearer ${accessToken}`;
  return nextConfig;
}

export function resetAuthStateSafely() {
  clearTokens();
  try {
    useAuthStore().resetAuth();
  } catch (_storeError) {
    // Pinia 초기화 전 또는 테스트 환경에서는 토큰 정리만 수행합니다.
  }
}

function isUnauthorized(error) {
  return isAuthExpiredStatus(error?.response?.status);
}

export async function handleAuthResponseError(error, client) {
  if (!shouldTryRefresh(error)) {
    if (shouldResetAuthForError(error)) {
      resetAuthStateSafely();
    }
    return Promise.reject(error);
  }

  let accessToken;
  try {
    accessToken = await refreshAccessTokenOnce();
  } catch (refreshError) {
    // refreshAccessTokenOnce 내부에서도 정리하지만, 호출 경로가 바뀌어도 인증 상태가 남지 않게 한 번 더 방어합니다.
    resetAuthStateSafely();
    return Promise.reject(refreshError);
  }

  const retryConfig = cleanupRetryConfig(error.config, accessToken);

  try {
    return await client.request(retryConfig);
  } catch (retryError) {
    // refresh는 성공했지만 같은 요청이 다시 401이면 현재 인증 상태를 더 이상 신뢰하지 않습니다.
    // 500, timeout, network error 등은 인증 토큰 문제가 아닐 수 있으므로 원본 에러만 호출부로 전파합니다.
    if (isUnauthorized(retryError)) {
      resetAuthStateSafely();
    }
    return Promise.reject(retryError);
  }
}

export function attachAuthInterceptors(client) {
  client.interceptors.request.use((config) => applyAuthRequestConfig(config));
  client.interceptors.response.use(
    (response) => response,
    (error) => handleAuthResponseError(error, client)
  );
  return client;
}
