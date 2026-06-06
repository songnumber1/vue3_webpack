import {computed} from "vue";
import {ROUTE_NAMES, CHAT_ROUTE_NAMES, STUDIO_ROUTE_NAMES} from "@/constants/routeNames";

const ROUTE_MODES = Object.freeze({
  MAIN: "main",
  CHAT: "chat",
  SHARED: "shared",
  STUDIO: "studio",
  CHAT_SEARCH: "chat-search",
});


export function resolveRouteMode(routeName) {
  if (routeName === ROUTE_NAMES.SHARED || routeName === ROUTE_NAMES.SHARED_ENTRY) return ROUTE_MODES.SHARED;
  if (STUDIO_ROUTE_NAMES.includes(routeName)) return ROUTE_MODES.STUDIO;
  if (routeName === ROUTE_NAMES.CHAT_SEARCH) return ROUTE_MODES.CHAT_SEARCH;
  if (CHAT_ROUTE_NAMES.includes(routeName)) return ROUTE_MODES.CHAT;
  return ROUTE_MODES.MAIN;
}

export function useRouteMode(route) {
  return computed(() => resolveRouteMode(route?.name));
}
