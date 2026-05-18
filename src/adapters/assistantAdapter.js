import {ASSISTANT_KEYS} from "@/constants/apiKeys";
import {ASSISTANT_TYPES} from "@/constants/domain";
import {toBoolean} from "./booleanAdapter";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description adaptAssistant 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} raw - raw 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function adaptAssistant(raw = {}) {
  const isStudio = toBoolean(raw[ASSISTANT_KEYS.STUDIO_YN]);
  const id = raw[ASSISTANT_KEYS.ID];
  const name = raw[ASSISTANT_KEYS.NAME] || "Assistant";

  // 계산된 결과를 호출부로 반환합니다.
  return {
    id,
    sourceId: id,
    type: isStudio ? ASSISTANT_TYPES.STUDIO : ASSISTANT_TYPES.ASSISTANT,
    label: name,
    name,
    description: isStudio
      ? "사용자 정의 Studio Assistant"
      : toBoolean(raw[ASSISTANT_KEYS.RAG_YN])
        ? "RAG 기반 질의응답 Assistant"
        : "일반 질의응답 Assistant",
    order: Number(raw[ASSISTANT_KEYS.ORDER] ?? 999),
    isStudio,
    isAuthorized: toBoolean(raw[ASSISTANT_KEYS.AUTH_YN]),
    isDeleted: toBoolean(raw[ASSISTANT_KEYS.DELETE_YN]),
    isFixed: toBoolean(raw[ASSISTANT_KEYS.FIX_YN]),
    isPrivate: toBoolean(raw[ASSISTANT_KEYS.PRIVATE_YN]),
    hasRag: toBoolean(raw[ASSISTANT_KEYS.RAG_YN]),
    raw,
  };
}

/**
 * @description adaptAssistantList 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} rawItems - rawItems 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function adaptAssistantList(rawItems = []) {
  // 계산된 결과를 호출부로 반환합니다.
  return rawItems
    .map(adaptAssistant)
    .filter((item) => item.id && item.isAuthorized && !item.isDeleted);
}
