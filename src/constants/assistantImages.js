import dsAssistantMark from "@/assets/img/ds-assistant-mark.svg";

/**
 * Assistant 기본 이미지 경로 설정
 */
export const DEFAULT_ASSISTANT_IMAGE = Object.freeze({
  Image48Src: dsAssistantMark,
  image20Src: dsAssistantMark,
  image16Src: dsAssistantMark,
});

/**
 * Assistant 이미지 경로를 크기별로 반환하는 헬퍼 함수
 * @param {*} assistant Assistant 객체
 * @param {number} size 원하는 이미지 크기 (16, 20, 48 중 하나)
 * @returns Assistant 이미지 경로
 */
export function getAssistantImageBySize(assistant, size = 48) {
  const key =
    size <= 16 ? "image16Src" : size <= 20 ? "image20Src" : "Image48Src";
  return (
    assistant?.[key] ||
    assistant?.Image48Src ||
    DEFAULT_ASSISTANT_IMAGE.Image48Src
  );
}
