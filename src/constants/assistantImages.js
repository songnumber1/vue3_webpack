import dsAssistantMark from "@/assets/img/ds-assistant-mark.svg";

export const DEFAULT_ASSISTANT_IMAGE = Object.freeze({
  Image48Src: dsAssistantMark,
  image20Src: dsAssistantMark,
  image16Src: dsAssistantMark,
});

export function getAssistantImageBySize(assistant, size = 48) {
  const key = size <= 16 ? "image16Src" : size <= 20 ? "image20Src" : "Image48Src";
  return assistant?.[key] || assistant?.Image48Src || DEFAULT_ASSISTANT_IMAGE.Image48Src;
}
