/**
 * @file utils/mermaidPlatformSettings.js
 * @description PC/Mobile을 구분하지 않는 Mermaid 렌더링 설정 유틸입니다.
 */

function readMermaidBooleanSetting(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;

  return fallback;
}

export function resolveMermaidPlatformSettings(settings = {}) {
  return {
    deviceMode: "common",
    showMermaidHeader: readMermaidBooleanSetting(
      settings.showMermaidHeader,
      true
    ),
    enableMermaidRendering: readMermaidBooleanSetting(
      settings.enableMermaidRendering,
      true
    ),
  };
}

export function isMermaidRenderingEnabledForPlatform(settings = {}) {
  return resolveMermaidPlatformSettings(settings).enableMermaidRendering;
}
