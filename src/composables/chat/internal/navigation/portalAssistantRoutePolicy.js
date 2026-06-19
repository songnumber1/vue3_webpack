/**
 * @file composables/chat/internal/navigation/portalAssistantRoutePolicy.js
 * @description Studio/MCP 포털 Assistant와 실제 route name 매핑을 한 곳에서 관리합니다.
 */

import {ASSISTANT_PORTAL_IDS} from "@/constants/assistantPortal";
import {ROUTE_NAMES} from "@/constants/routeNames";

const PORTAL_ROUTE_BY_ASSISTANT_ID = Object.freeze({
  [ASSISTANT_PORTAL_IDS.STUDIO]: ROUTE_NAMES.STUDIO,
  [ASSISTANT_PORTAL_IDS.CONNECTOR_STORE]: ROUTE_NAMES.CONNECTOR_STORE,
});

const PORTAL_ASSISTANT_ID_BY_ROUTE_NAME = Object.freeze({
  [ROUTE_NAMES.STUDIO]: ASSISTANT_PORTAL_IDS.STUDIO,
  [ROUTE_NAMES.CONNECTOR_STORE]: ASSISTANT_PORTAL_IDS.CONNECTOR_STORE,
});

function normalizeKey(value) {
  return String(value || "").trim();
}

export function getPortalAssistantRouteName(assistantId) {
  return (
    PORTAL_ROUTE_BY_ASSISTANT_ID[normalizeKey(assistantId)] ||
    ROUTE_NAMES.STUDIO
  );
}

export function createPortalAssistantRoute(assistantId) {
  return {name: getPortalAssistantRouteName(assistantId)};
}

export function getPortalAssistantIdByRouteName(routeName) {
  return PORTAL_ASSISTANT_ID_BY_ROUTE_NAME[normalizeKey(routeName)] || "";
}

export function isPortalRouteName(routeName) {
  return Boolean(getPortalAssistantIdByRouteName(routeName));
}
