/**
 * @file constants/assistantImages.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

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
