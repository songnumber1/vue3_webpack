import {ASSISTANT_KEYS} from "@/constants/apiKeys";
import {ASSISTANT_TYPES} from "@/constants/domain";
import {toBoolean} from "./booleanAdapter";
import {DEFAULT_ASSISTANT_IMAGE} from "@/constants/assistantImages";

/**
 * Assistant 이미지 경로를 다양한 형태로 처리하여 반환하는 헬퍼 함수
 * @param {*} raw ep. { image48Src: "url", image20Src: { path: "url" }, ... }
 * @param {*} key ep. ASSISTANT_KEYS.IMAGE_48_SRC, ASSISTANT_KEYS.IMAGE_20_SRC, ASSISTANT_KEYS.IMAGE_16_SRC
 * @param {*} fallback 기본 이미지 경로 (DEFAULT_ASSISTANT_IMAGE에서 가져옴)
 * @returns
 */
function resolveAssistantImage(raw, key, fallback) {
  // raw 객체에서 key에 해당하는 값을 가져옴
  const value = raw?.[key];

  // 값이 문자열이고 빈 문자열이 아닌 경우 해당 값을 반환
  if (typeof value === "string" && value) return value;

  // 값의 형태가 객체이고 path 속성이 존재하는 경우 path 값을 반환
  if (value?.path) return value.path;

  // 위 조건에 해당하지 않는 경우 fallback 이미지 경로를 반환
  return fallback;
}

export function adaptAssistant(raw = {}) {
  const isStudio = toBoolean(raw[ASSISTANT_KEYS.STUDIO_YN]);
  const id = raw[ASSISTANT_KEYS.ID];
  const name = raw[ASSISTANT_KEYS.NAME] || "Assistant";

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
    Image48Src: resolveAssistantImage(
      raw,
      ASSISTANT_KEYS.IMAGE_48_SRC,
      DEFAULT_ASSISTANT_IMAGE.Image48Src
    ),
    image20Src: resolveAssistantImage(
      raw,
      ASSISTANT_KEYS.IMAGE_20_SRC,
      DEFAULT_ASSISTANT_IMAGE.image20Src
    ),
    image16Src: resolveAssistantImage(
      raw,
      ASSISTANT_KEYS.IMAGE_16_SRC,
      DEFAULT_ASSISTANT_IMAGE.image16Src
    ),
    raw,
  };
}
export function adaptAssistantList(rawItems = []) {
  return rawItems
    .map(adaptAssistant)
    .filter((item) => item.id && item.isAuthorized && !item.isDeleted);
}
