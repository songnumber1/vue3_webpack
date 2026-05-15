/**
 * @file modelAdapter.js
 * @description 운영 model API 응답을 모델 선택/대화 세션에서 사용하는 ViewModel로 변환합니다.
 */

import {MODEL_KEYS} from "@/constants/apiKeys";
import {toBoolean} from "./booleanAdapter";

/**
 * 단일 모델 raw row를 ModelViewModel로 변환합니다.
 *
 * method: adapter
 * payload: model/info/model.do 또는 model/info/studio-model.do row
 * response: { id, assistId, label, isAuthorized, isDeleted }
 * 특징: delYN=true 모델은 기존 대화방 복원을 위해 allModels에는 보존하고 신규 선택 목록에서는 제외합니다.
 *
 * @param {object} raw - 모델 raw row입니다.
 * @returns {object} ModelViewModel입니다.
 */
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
    raw,
  };
}

/**
 * 모델 raw 배열을 ModelViewModel 배열로 변환합니다.
 *
 * @param {Array<object>} rawItems - 모델 raw 배열입니다.
 * @param {object} options - 필터 옵션입니다.
 * @param {boolean} [options.includeDeleted=false] - 삭제 모델 포함 여부입니다.
 * @param {boolean} [options.includeUnauthorized=false] - 권한 없는 모델 포함 여부입니다.
 * @returns {Array<object>} 정규화된 모델 목록입니다.
 */
export function adaptModelList(rawItems = [], options = {}) {
  const {includeDeleted = false, includeUnauthorized = false} = options;

  return rawItems.map(adaptModel).filter((item) => {
    if (!item.id || !item.assistId) return false;
    if (!includeUnauthorized && !item.isAuthorized) return false;
    if (!includeDeleted && item.isDeleted) return false;
    return true;
  });
}

/**
 * 신규 대화 생성/모델 선택에 표시 가능한 모델만 필터링합니다.
 * @param {Array<object>} models - 전체 모델 목록입니다.
 * @returns {Array<object>} 권한 있고 삭제되지 않은 모델 목록입니다.
 */
export function filterAvailableModels(models = []) {
  return models.filter(
    (item) => item.id && item.assistId && item.isAuthorized && !item.isDeleted
  );
}
