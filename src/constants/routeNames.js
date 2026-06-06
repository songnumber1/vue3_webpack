/**
 * @file constants/routeNames.js
 * @description Vue Router route name constants used by routing and chat URL policies.
 */

export const ROUTE_NAMES = Object.freeze({
  MAIN: "main",
  CHAT_ENTRY: "chat-entry",
  CHAT_DETAIL: "chat",
  CHAT_SEARCH: "chat-search",
  STUDIO: "studio",
  CONNECTOR_STORE: "connector-store",
  SWAGGER: "swagger",
  GUIDE: "guide",
  SHARED: "shared",
  SHARED_ENTRY: "shared-entry",
  PLAYGROUND: "playground",
  TERMS: "terms",
  LOGIN_REQUIRED: "login-required",
  ANDROID_UPDATE: "android-update",
});

export const CHAT_ROUTE_NAMES = Object.freeze([
  ROUTE_NAMES.CHAT_DETAIL,
  ROUTE_NAMES.CHAT_ENTRY,
]);

export const STUDIO_ROUTE_NAMES = Object.freeze([
  ROUTE_NAMES.STUDIO,
  ROUTE_NAMES.CONNECTOR_STORE,
]);

export const SHARED_ROUTE_NAMES = Object.freeze([
  ROUTE_NAMES.SHARED,
  ROUTE_NAMES.SHARED_ENTRY,
]);
