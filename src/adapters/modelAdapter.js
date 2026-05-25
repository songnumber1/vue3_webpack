/**
 * @file adapters/modelAdapter.js
 * @description 백엔드/mock 원본 응답을 화면에서 쓰기 쉬운 형태로 정규화하는 adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

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
