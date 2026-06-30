import {
  AUTH_CLIENT_PLATFORM_HEADER,
  isAuthPublicUrl,
  resolveSessionAuthConfig,
} from "@/auth/authPolicy";
import {resetAuthStateSafely} from "@/auth/authState";

function ensureHeaders(config) {
  config.headers = config.headers || {};
  return config.headers;
}

export function applySessionRequestConfig(config = {}) {
  const session = resolveSessionAuthConfig();
  const headers = ensureHeaders(config);

  config.withCredentials = true;
  headers[AUTH_CLIENT_PLATFORM_HEADER] = session.platform;

  return config;
}

export function isAuthExpiredStatus(status) {
  return status === 401 || status === 403;
}

function shouldResetAuthForError(error) {
  const status = error?.response?.status;
  const config = error?.config || {};
  return isAuthExpiredStatus(status) && !isAuthPublicUrl(config.url);
}

export {resetAuthStateSafely};

export function handleSessionAuthError(error) {
  if (shouldResetAuthForError(error)) {
    resetAuthStateSafely();
  }
  return Promise.reject(error);
}
