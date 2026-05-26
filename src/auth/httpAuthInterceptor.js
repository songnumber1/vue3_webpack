import {resolveAuthPolicy, isAuthPublicUrl} from "@/auth/authPolicy";
import {AUTH_HEADER_NAMES} from "@/auth/authConstants";
import {getAccessToken} from "@/auth/tokenStore";
import {refreshAccessTokenOnce} from "@/auth/refreshTokenService";

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

function shouldTryRefresh(error) {
  const status = error?.response?.status;
  const config = error?.config || {};
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

export async function handleAuthResponseError(error, client) {
  if (!shouldTryRefresh(error)) return Promise.reject(error);
  const accessToken = await refreshAccessTokenOnce();
  const retryConfig = cleanupRetryConfig(error.config, accessToken);
  return client.request(retryConfig);
}

export function attachAuthInterceptors(client) {
  client.interceptors.request.use((config) => applyAuthRequestConfig(config));
  client.interceptors.response.use(
    (response) => response,
    (error) => handleAuthResponseError(error, client)
  );
  return client;
}
