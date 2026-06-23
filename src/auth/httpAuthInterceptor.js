import {resolveAuthPolicy} from "@/auth/authPolicy";
import {AUTH_HEADER_NAMES} from "@/auth/authConstants";
import {resetAuthStateSafely} from "@/auth/authState";
import {resolveAuthStrategy} from "@/auth/resolveAuthStrategy";

function ensureHeaders(config) {
  config.headers = config.headers || {};
  return config.headers;
}

function applyCommonAuthRequestConfig(config, policy) {
  const headers = ensureHeaders(config);

  config.withCredentials = policy.withCredentials;
  headers[AUTH_HEADER_NAMES.CLIENT_PLATFORM] = policy.platform;
  headers[AUTH_HEADER_NAMES.AUTH_MODE] = policy.authMode;

  return config;
}

export function applyAuthRequestConfig(config = {}) {
  const policy = resolveAuthPolicy();
  const strategy = resolveAuthStrategy(policy);

  config = applyCommonAuthRequestConfig(config, policy);
  return strategy.applyRequest(config, policy);
}

export function isAuthExpiredStatus(status) {
  return status === 401 || status === 403;
}

export function shouldTryRefresh(error) {
  const policy = resolveAuthPolicy();
  const strategy = resolveAuthStrategy(policy);
  return strategy.shouldTryRefresh(error, policy);
}

export {resetAuthStateSafely};

export async function handleAuthResponseError(error, client) {
  const policy = resolveAuthPolicy();
  const strategy = resolveAuthStrategy(policy);
  return strategy.handleResponseError(error, client, policy);
}

export function attachAuthInterceptors(client) {
  client.interceptors.request.use((config) => applyAuthRequestConfig(config));
  client.interceptors.response.use(
    (response) => response,
    (error) => handleAuthResponseError(error, client)
  );
  return client;
}
