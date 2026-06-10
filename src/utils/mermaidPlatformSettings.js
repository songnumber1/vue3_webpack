/**
 * @file utils/mermaidPlatformSettings.js
 * @description 플랫폼별 Mermaid 표시/렌더링 설정을 선택하는 순수 유틸입니다.
 */

import {
  DEFAULT_MOBILE_BREAKPOINT_PX,
  PLATFORM_OVERRIDE_MODES,
} from "@/constants/systemSettings";

export const MERMAID_SETTING_DEVICE_MODES = Object.freeze({
  pc: "pc",
  mobile: "mobile",
});

function readMermaidBooleanSetting(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;

  return fallback;
}

export function isForcedMobileMermaidPlatform(platformOverride) {
  return (
    platformOverride === PLATFORM_OVERRIDE_MODES.androidChrome ||
    platformOverride === PLATFORM_OVERRIDE_MODES.androidWebView
  );
}

function isBrowserMobileViewport(settings = {}) {
  if (typeof document !== "undefined") {
    if (document.body?.classList?.contains("mobile-mode")) return true;
  }

  if (typeof window === "undefined") return false;

  const breakpoint = Number(settings.mobileBreakpoint);
  const normalizedBreakpoint =
    Number.isFinite(breakpoint) && breakpoint > 0
      ? breakpoint
      : DEFAULT_MOBILE_BREAKPOINT_PX;

  return Number(window.innerWidth || 0) <= normalizedBreakpoint;
}

export function resolveMermaidSettingDeviceMode(
  settings = {},
  isMobile = undefined
) {
  if (isForcedMobileMermaidPlatform(settings.platformOverride)) {
    return MERMAID_SETTING_DEVICE_MODES.mobile;
  }

  const shouldUseMobile =
    typeof isMobile === "boolean"
      ? isMobile
      : isBrowserMobileViewport(settings);

  return shouldUseMobile
    ? MERMAID_SETTING_DEVICE_MODES.mobile
    : MERMAID_SETTING_DEVICE_MODES.pc;
}

export function resolveMermaidPlatformSettings(settings = {}, isMobile) {
  const deviceMode = resolveMermaidSettingDeviceMode(settings, isMobile);

  if (deviceMode === MERMAID_SETTING_DEVICE_MODES.mobile) {
    return {
      deviceMode,
      showMermaidHeader: readMermaidBooleanSetting(
        settings.mobileShowMermaidHeader,
        true
      ),
      enableMermaidRendering: readMermaidBooleanSetting(
        settings.mobileEnableMermaidRendering,
        true
      ),
    };
  }

  return {
    deviceMode,
    showMermaidHeader: readMermaidBooleanSetting(
      settings.pcShowMermaidHeader,
      true
    ),
    enableMermaidRendering: readMermaidBooleanSetting(
      settings.pcEnableMermaidRendering,
      true
    ),
  };
}

export function isMermaidRenderingEnabledForPlatform(settings = {}, isMobile) {
  return resolveMermaidPlatformSettings(settings, isMobile)
    .enableMermaidRendering;
}
