/**
 * @file composables/chat/internal/policy/chatHeaderPolicy.js
 * @description Chat Header와 workspace에 표시할 Assistant 라벨/대화방 제목 우선순위를 한 곳에서 결정합니다.
 */

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function resolveConversationTitle({
  isSharedPage = false,
  activeHistoryId = "",
  activeHistory = null,
  t = null,
} = {}) {
  if (isSharedPage) {
    if (typeof t === "function") {
      return t("chat.sharedConversationTitle", {
        id: activeHistoryId || "",
      }).trim();
    }
    return normalizeText(activeHistoryId);
  }

  return normalizeText(activeHistory?.title);
}

export function resolveWorkspaceAssistantLabel({
  activeSession = null,
  currentAssistant = null,
  fallbackLabel = "Assistant",
} = {}) {
  const displayAssistantLabel = normalizeText(
    activeSession?.displayAssistantLabel
  );
  if (displayAssistantLabel) return displayAssistantLabel;

  const sessionAssistantLabel = normalizeText(activeSession?.assistantLabel);
  if (sessionAssistantLabel && !activeSession?.isModelUnavailable) {
    return sessionAssistantLabel;
  }

  return normalizeText(currentAssistant?.label) || fallbackLabel;
}
