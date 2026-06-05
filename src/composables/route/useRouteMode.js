import {computed} from "vue";

const ROUTE_MODES = Object.freeze({
  MAIN: "main",
  CHAT: "chat",
  SHARED: "shared",
  STUDIO: "studio",
  CHAT_SEARCH: "chat-search",
});

const STUDIO_ROUTE_NAMES = Object.freeze(["studio", "connector-store"]);
const CHAT_ROUTE_NAMES = Object.freeze(["chat", "chat-entry"]);

export function resolveRouteMode(routeName) {
  if (routeName === "shared") return ROUTE_MODES.SHARED;
  if (STUDIO_ROUTE_NAMES.includes(routeName)) return ROUTE_MODES.STUDIO;
  if (routeName === "chat-search") return ROUTE_MODES.CHAT_SEARCH;
  if (CHAT_ROUTE_NAMES.includes(routeName)) return ROUTE_MODES.CHAT;
  return ROUTE_MODES.MAIN;
}

export function useRouteMode(route) {
  return computed(() => resolveRouteMode(route?.name));
}
