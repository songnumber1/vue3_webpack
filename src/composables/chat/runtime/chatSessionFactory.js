import {createId} from "@/utils/id";

export function createLocalHistory(text, assistant, model) {
  const id = createId();

  return {
    id,
    temporary: true,
    syncStatus: "local",
    title: text || "New chat",
    preview: text || "New conversation from attachments",
    modelId: model?.id || "",
    assistantId: assistant?.id || model?.assistId || "",
    assistantType: assistant?.type || "",
    assistantLabel: assistant?.label || "",
    modelLabel: model?.label || "",
    isPinned: false,
    endedAt: new Date().toISOString(),
    userId: "",
    raw: null,
  };
}

export function createSessionFromHistory(
  history,
  modelMap = {},
  assistantMap = {}
) {
  if (!history) return null;

  const model = modelMap[history.modelId] || null;
  const assistant =
    assistantMap[history.assistantId || model?.assistId] || null;
  const modelMissing = Boolean(history.modelId && !model);
  const assistantMissing = Boolean(
    (history.assistantId || model?.assistId) && !assistant
  );
  const modelDeleted = Boolean(model?.isDeleted);
  const unavailableReason = modelDeleted
    ? "deleted"
    : modelMissing
      ? "missing-model"
      : assistantMissing
        ? "missing-assistant"
        : "";

  return {
    chatId: history.id,
    assistantId: assistant?.id || history.assistantId || model?.assistId || "",
    assistantType: assistant?.type || history.assistantType || "",
    assistantLabel: assistant?.label || history.assistantLabel || "",
    modelId: model?.id || history.modelId || "",
    modelName: model?.label || history.modelLabel || "",
    modelType: model?.type || "",
    isModelDeleted: modelDeleted,
    isModelMissing: modelMissing,
    isAssistantMissing: assistantMissing,
    isModelUnavailable: Boolean(unavailableReason),
    modelUnavailableReason: unavailableReason,
    displayAssistantId: "",
    displayAssistantLabel: "",
    readonlyModel: true,
  };
}
