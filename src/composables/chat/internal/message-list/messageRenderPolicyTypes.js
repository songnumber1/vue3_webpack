/**
 * @file messageRenderPolicyTypes.js
 * @description 메시지 렌더링 정책에서 공유하는 순수 상수와 플랫폼 판정 함수입니다.
 */

import {PLATFORM_OVERRIDE_MODES} from "@/constants/systemSettings";

export const MESSAGE_SCROLL_TARGET_TYPES = Object.freeze({
  bottom: "bottom",
  first: "first",
  message: "message",
});

export const HISTORY_RENDER_STRATEGIES = Object.freeze({
  mobileCurrent: "mobile-current",
  pcBlockingCurrent: "pc-blocking-current",
  pcProgressiveShared: "pc-progressive-shared",
  pcProgressiveNormal: "pc-progressive-normal",
  pcProgressiveSearch: "pc-progressive-search",
});

export function isForcedMobilePlatformOverride(platformOverride) {
  return (
    platformOverride === PLATFORM_OVERRIDE_MODES.androidChrome ||
    platformOverride === PLATFORM_OVERRIDE_MODES.androidWebView
  );
}
