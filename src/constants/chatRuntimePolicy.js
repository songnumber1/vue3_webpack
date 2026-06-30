/**
 * @file constants/chatRuntimePolicy.js
 * @description 채팅 공통 정책은 모바일 ProgressBar 여부만 유지합니다.
 */

export const SHOW_MOBILE_PROGRESS = true;

export const CHAT_RUNTIME_POLICY = Object.freeze({
  showMobileProgress: SHOW_MOBILE_PROGRESS,
});

export function shouldShowMobileProgress(isMobileLayout) {
  return SHOW_MOBILE_PROGRESS === true && Boolean(isMobileLayout);
}

export function isProgressAllowedForCurrentPlatform(platformInfo = {}) {
  return shouldShowMobileProgress(
    Boolean(platformInfo?.isMobile || platformInfo?.isCompactViewport)
  );
}
