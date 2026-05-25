/**
 * @file adapters/assistantAdapter.js
 * @description 백엔드/mock 원본 응답을 화면에서 쓰기 쉬운 형태로 정규화하는 adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {ASSISTANT_KEYS} from "@/constants/apiKeys";
import {ASSISTANT_TYPES} from "@/constants/domain";
import {toBoolean} from "@/utils/typeConvert";
import {DEFAULT_ASSISTANT_IMAGE} from "@/constants/assistantImages";

/**
 * Assistant 이미지 경로를 다양한 형태로 처리하여 반환하는 헬퍼 함수
 * @param {*} raw ep. { image48Src: "url", image20Src: { path: "url" }, ... }
 * @param {*} key ep. ASSISTANT_KEYS.IMAGE_48_SRC, ASSISTANT_KEYS.IMAGE_20_SRC, ASSISTANT_KEYS.IMAGE_16_SRC
 * @param {*} fallback 기본 이미지 경로 (DEFAULT_ASSISTANT_IMAGE에서 가져옴)
 * @returns
 */
/**
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
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
