import {isAuthPublicUrl} from "@/auth/authPolicy";
import {resetAuthStateSafely} from "@/auth/authState";

function isAuthExpiredStatus(status) {
  return status === 401 || status === 403;
}

function shouldResetAuthForError(error) {
  const status = error?.response?.status;
  const config = error?.config || {};
  if (!isAuthExpiredStatus(status)) return false;
  if (isAuthPublicUrl(config.url)) return false;
  return true;
}

export const sessionAuthStrategy = {
  applyRequest(config = {}) {
    // Session 인증은 브라우저 Cookie + withCredentials 정책으로 처리합니다.
    // Authorization 헤더나 refresh retry는 주입하지 않습니다.
    return config;
  },

  shouldTryRefresh() {
    return false;
  },

  async handleResponseError(error) {
    if (shouldResetAuthForError(error)) {
      resetAuthStateSafely();
    }
    return Promise.reject(error);
  },
};
