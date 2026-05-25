import {MODEL_KEYS} from "@/constants/apiKeys";
import {toBoolean} from "@/utils/typeConvert";

export function adaptModel(raw = {}) {
  const id = raw[MODEL_KEYS.ID];
  const label = raw[MODEL_KEYS.NAME] || "Model";

  return {
    id,
    sourceId: id,
    assistId: raw[MODEL_KEYS.ASSISTANT_ID],
    label,
    name: label,
    description: raw.modelDesc || `${raw[MODEL_KEYS.TYPE] || "instance"} 모델`,
    type: raw[MODEL_KEYS.TYPE] || "instance",
    order: Number(raw[MODEL_KEYS.ORDER] ?? 999),
    isAuthorized: toBoolean(raw[MODEL_KEYS.AUTH_YN]),
    isDeleted: toBoolean(raw[MODEL_KEYS.DELETE_YN]),
    isRecommended: toBoolean(raw.recommandYN),
    isNew: toBoolean(raw.newYN),
    isStudioModel: toBoolean(raw.studioYN),
    hasImage: toBoolean(raw.imageYN),
    hasRag: toBoolean(raw.ragYN),
    isReasoning: toBoolean(raw.isReasoning),
    raw,
  };
}
export function adaptModelList(rawItems = [], options = {}) {
  const {includeDeleted = false, includeUnauthorized = false} = options;

  return rawItems.map(adaptModel).filter((item) => {
    if (!item.id || !item.assistId) return false;
    if (!includeUnauthorized && !item.isAuthorized) return false;
    if (!includeDeleted && item.isDeleted) return false;

    return true;
  });
}
export function filterAvailableModels(models = []) {
  return models.filter(
    (item) => item.id && item.assistId && item.isAuthorized && !item.isDeleted
  );
}
