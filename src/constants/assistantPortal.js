/**
 * @file constants/assistantPortal.js
 * @description Studio/MCP portal assistant id 기준값을 한 곳에서 관리합니다.
 */

export const ASSISTANT_PORTAL_IDS = Object.freeze({
  STUDIO: "assistant-studio",
  CONNECTOR_STORE: "connector-store",
});

export const ASSISTANT_PORTAL_ID_LIST = Object.freeze([
  ASSISTANT_PORTAL_IDS.STUDIO,
  ASSISTANT_PORTAL_IDS.CONNECTOR_STORE,
]);

const ASSISTANT_PORTAL_ID_SET = new Set(ASSISTANT_PORTAL_ID_LIST);

function getAssistantPortalId(assistantId) {
  return String(assistantId || "").trim();
}

export function isAssistantStudioPortalId(assistantId) {
  return (
    getAssistantPortalId(assistantId) === ASSISTANT_PORTAL_IDS.STUDIO
  );
}

export function isConnectorStorePortalId(assistantId) {
  return (
    getAssistantPortalId(assistantId) ===
    ASSISTANT_PORTAL_IDS.CONNECTOR_STORE
  );
}

export function isPortalAssistantId(assistantId) {
  return ASSISTANT_PORTAL_ID_SET.has(getAssistantPortalId(assistantId));
}
