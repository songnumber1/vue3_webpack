/**
 * @file constants/routeNames.js
 * @description Vue Router route name constants used by routing and chat URL policies.
 */

import {ASSISTANT_PORTAL_IDS} from "@/constants/assistantPortal";


export const ROUTE_PATHS = Object.freeze({
  MAIN: "",
  MAIN_ALIAS: "main",
  CHAT: "chat-completion",
  CHAT_DETAIL: "chat-completion/:id",
  SHARE_CHAT: "share-chat/:id",
  CHAT_SEARCH: "chat-search",
  STUDIO: "studio",
  CONNECTOR_STORE: "mcp",
  SWAGGER: "swagger",
  GUIDE: "guide",
  SHARED: "shared",
  SHARED_ENTRY: "shared/:id",
  TERMS: "terms",
  LOGIN_REQUIRED: "/login-required",
  ANDROID_UPDATE: "/android-update",
});

export const ROUTE_NAMES = Object.freeze({
  MAIN: "main",
  CHAT_ENTRY: "chat-entry",
  CHAT_DETAIL: "chat",
  CHAT_SEARCH: "chat-search",
  STUDIO: "studio",
  CONNECTOR_STORE: ASSISTANT_PORTAL_IDS.CONNECTOR_STORE,
  SWAGGER: "swagger",
  GUIDE: "guide",
  SHARED: "shared",
  SHARED_ENTRY: "shared-entry",
  SHARE_CHAT_ENTRY: "share-chat-entry",
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
  ROUTE_NAMES.SHARE_CHAT_ENTRY,
]);

