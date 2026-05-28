import {DEFAULT_API_BASE_PATH} from "@/constants/apiMode";

export const AUTH_MODES = Object.freeze({
  SESSION: "session",
  JWT: "jwt",
});

export const AUTH_HEADER_NAMES = Object.freeze({
  AUTHORIZATION: "Authorization",
  CLIENT_PLATFORM: "X-Client-Platform",
  AUTH_MODE: "X-Auth-Mode",
});

const AUTH_PUBLIC_PATHS = [
  "/login.do",
  "/temp-login.do",
  "/logout.do",
  "/auth/refresh.do",
];

export const AUTH_SKIP_URLS = [
  ...AUTH_PUBLIC_PATHS,
  ...AUTH_PUBLIC_PATHS.map((path) => `${DEFAULT_API_BASE_PATH}${path}`),
];
