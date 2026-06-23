/**
 * @file composables/chat/internal/policy/chatSessionPolicy.js
 * @description 대화방 세션의 Assistant/Studio 삭제, 표시용 Assistant 라벨, 입력 불가 상태를 한 곳에서 결정합니다.
 */

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value) {
  return normalizeText(String(value || ""));
}

function firstNonEmptyText(...values) {
  return values.map(normalizeText).find(Boolean) || "";
}

export function resolveHistoryAssistantLabel(history = {}, session = {}) {
  const raw = history.raw || {};
  return firstNonEmptyText(
    session.assistantLabel,
    history.assistantLabel,
    raw.assistantLabel,
    raw.assistName,
    raw.assistNm,
    raw.assistantName
  );
}

export function isStudioConversationSession({
  history = {},
  session = {},
  assistant = null,
} = {}) {
  return Boolean(
    session?.assistantType === "studio" ||
    history?.assistantType === "studio" ||
    assistant?.type === "studio" ||
    assistant?.isStudio === true ||
    assistant?.studio === true
  );
}

export function resolveDeletedStudioSessionState({
  history = {},
  session = {},
  assistantMap = {},
  studioRuntimeStore = null,
} = {}) {
  const assistantId = normalizeId(session?.assistantId || history?.assistantId);
  const assistant = assistantMap?.[assistantId] || null;
  const isStudioSession = isStudioConversationSession({
    history,
    session,
    assistant,
  });
  const isDeleted = Boolean(
    isStudioSession &&
    assistantId &&
    studioRuntimeStore?.isStudioDeleted?.(assistantId)
  );

  return {
    assistantId,
    isStudioSession,
    isDeleted,
    displayLabel: isDeleted
      ? resolveHistoryAssistantLabel(history, session)
      : "",
  };
}

export function markSessionAsMissingAssistant({
  session = {},
  assistantId = "",
  assistantLabel = "",
  assistantType = "studio",
} = {}) {
  const deletedAssistantId = normalizeId(assistantId || session?.assistantId);
  const deletedAssistantLabel = firstNonEmptyText(
    session?.displayAssistantLabel,
    session?.assistantLabel,
    assistantLabel
  );

  return {
    ...session,
    chatId: session?.chatId || "",
    assistantId: session?.assistantId || deletedAssistantId,
    assistantType: session?.assistantType || assistantType,
    assistantLabel: session?.assistantLabel || deletedAssistantLabel,
    displayAssistantId: session?.displayAssistantId || deletedAssistantId,
    displayAssistantLabel:
      session?.displayAssistantLabel || deletedAssistantLabel,
    isAssistantMissing: true,
    isModelUnavailable: true,
    modelUnavailableReason: "missing-assistant",
  };
}

export function resolveConversationSessionState({
  history = {},
  session = null,
  assistantMap = {},
  assistants = [],
  studioRuntimeStore = null,
  preserveSidebarAssistant = false,
} = {}) {
  if (!session) {
    return {
      session: null,
      displayAssistant: null,
      shouldUseFallbackAssistant: false,
      isRuntimeDeletedStudioSession: false,
      deletedStudioAssistantLabel: "",
      nextSelectedAssistantId: "",
    };
  }

  const nextSession = {...session};
  const deletedStudio = resolveDeletedStudioSessionState({
    history,
    session: nextSession,
    assistantMap,
    studioRuntimeStore,
  });

  if (deletedStudio.isDeleted) {
    Object.assign(
      nextSession,
      markSessionAsMissingAssistant({
        session: nextSession,
        assistantId: deletedStudio.assistantId,
        assistantLabel: deletedStudio.displayLabel,
        assistantType: "studio",
      })
    );
  }

  const fallbackAssistant = Array.isArray(assistants)
    ? assistants[0] || null
    : null;
  const shouldUseFallbackAssistant = Boolean(
    nextSession?.isModelDeleted ||
    nextSession?.isModelMissing ||
    nextSession?.isAssistantMissing ||
    deletedStudio.isDeleted ||
    !nextSession?.assistantId
  );
  const displayAssistant = shouldUseFallbackAssistant
    ? fallbackAssistant
    : assistantMap?.[nextSession.assistantId] || fallbackAssistant;

  if (deletedStudio.displayLabel) {
    nextSession.displayAssistantId = deletedStudio.assistantId;
    nextSession.displayAssistantLabel = deletedStudio.displayLabel;
  } else if (displayAssistant?.id) {
    nextSession.displayAssistantId = displayAssistant.id;
    nextSession.displayAssistantLabel = displayAssistant.label;
  }

  return {
    session: nextSession,
    displayAssistant,
    shouldUseFallbackAssistant,
    isRuntimeDeletedStudioSession: deletedStudio.isDeleted,
    deletedStudioAssistantLabel: deletedStudio.displayLabel,
    nextSelectedAssistantId:
      !preserveSidebarAssistant &&
      !deletedStudio.displayLabel &&
      displayAssistant?.id
        ? displayAssistant.id
        : "",
  };
}
