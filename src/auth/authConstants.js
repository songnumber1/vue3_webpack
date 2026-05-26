export const AUTH_MODES = Object.freeze({
  SESSION: "session",
  JWT: "jwt",
});

export const AUTH_HEADER_NAMES = Object.freeze({
  AUTHORIZATION: "Authorization",
  CLIENT_PLATFORM: "X-Client-Platform",
  AUTH_MODE: "X-Auth-Mode",
});

export const AUTH_SKIP_URLS = [
  "/login.do",
  "/temp-login.do",
  "/logout.do",
  "/auth/refresh.do",
  "/api/login.do",
  "/api/temp-login.do",
  "/api/logout.do",
  "/api/auth/refresh.do",
];
