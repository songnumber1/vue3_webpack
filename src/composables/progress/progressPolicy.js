/**
 * @file composables/progress/progressPolicy.js
 * @description 전역 ProgressBar 표시 여부를 화면 너비가 아니라 플랫폼 설정 기준으로 판별합니다.
 */

import {PLATFORM_OVERRIDE_MODES} from "@/constants/systemSettings";

const PROGRESS_PLATFORMS = Object.freeze({
  pc: "pc",
  mobile: "mobile",
});

function isForcedMobilePlatform(settings = {}) {
  return [
    PLATFORM_OVERRIDE_MODES.androidChrome,
    PLATFORM_OVERRIDE_MODES.androidWebView,
  ].includes(settings.platformOverride);
}

/**
 * ProgressBar의 PC/모바일 기준을 계산합니다.
 * - 1순위: 시스템 강제 플랫폼 설정
 * - 2순위: 실제 플랫폼 감지 정보
 * - 사용하지 않음: 화면 너비, mobileBreakpoint
 */
export function resolveProgressPlatform(settings = {}, platformInfo = {}) {
  if (isForcedMobilePlatform(settings)) return PROGRESS_PLATFORMS.mobile;

  return platformInfo?.isMobile || platformInfo?.isAndroid
    ? PROGRESS_PLATFORMS.mobile
    : PROGRESS_PLATFORMS.pc;
}

/**
 * 코드가 progress 표시를 요청했을 때, 현재 플랫폼 설정상 실제 렌더링이 허용되는지 판단합니다.
 */
export function isProgressAllowedForCurrentPlatform(
  settings = {},
  platformInfo = {}
) {
  const progressPlatform = resolveProgressPlatform(settings, platformInfo);

  return progressPlatform === PROGRESS_PLATFORMS.mobile
    ? settings.showMobileProgress === true
    : settings.showPcProgress === true;
}
