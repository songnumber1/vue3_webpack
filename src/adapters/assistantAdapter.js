import {ASSISTANT_KEYS} from "@/constants/apiKeys";
import {ASSISTANT_TYPES} from "@/constants/domain";
import {toBoolean} from "./booleanAdapter";
import {DEFAULT_ASSISTANT_IMAGE} from "@/constants/assistantImages";

function resolveAssistantImage(raw, key, fallback) {
  const value = raw?.[key];
  if (typeof value === "string" && value) return value;
  if (value?.path) return value.path;
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
