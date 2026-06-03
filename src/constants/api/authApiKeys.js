/**
 * @file constants/api/authApiKeys.js
 * @description 인증/세션/JWT API 원본 key 모음입니다.
 */

export const AUTH_API_KEYS = Object.freeze({
  PATH: "path",
  AUTHENTICATED: "authenticated",
  AUTH_MODE: "authMode",
  USER: "user",
  USER_ID: "userId",
  USER_NAME: "userName",
  ADMIN_TYPE: "adminType",
  SUCCESS: "success",
  VALID: "valid",
  ACCESS_TOKEN: "accessToken",
  ACCESS_TOKEN_SNAKE: "access_token",
  REFRESH_TOKEN: "refreshToken",
  REFRESH_TOKEN_SNAKE: "refresh_token",
  EXPIRES_IN: "expiresIn",
  TOKEN_TYPE: "tokenType",
  CODE: "code",
  MESSAGE: "message",
  ENTRY_TYPE: "entryType",
});

export default AUTH_API_KEYS;
