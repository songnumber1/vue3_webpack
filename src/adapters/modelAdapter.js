import {MODEL_KEYS} from "@/constants/apiKeys";
import {toBoolean} from "./booleanAdapter";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description adaptModel 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} raw - raw 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
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
 * @description adaptModelList 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} rawItems - rawItems 입력값입니다.
 * @param {*} options - options 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function adaptModelList(rawItems = [], options = {}) {
  const {includeDeleted = false, includeUnauthorized = false} = options;

  return rawItems.map(adaptModel).filter((item) => {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!item.id || !item.assistId) return false;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!includeUnauthorized && !item.isAuthorized) return false;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!includeDeleted && item.isDeleted) return false;

    return true;
  });
}

/**
 * @description filterAvailableModels 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} models - models 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function filterAvailableModels(models = []) {
  return models.filter(
    (item) => item.id && item.assistId && item.isAuthorized && !item.isDeleted
  );
}
