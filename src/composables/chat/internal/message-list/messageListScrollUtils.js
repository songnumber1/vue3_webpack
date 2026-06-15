import {PLATFORM_OVERRIDE_MODES} from "@/constants/systemSettings";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";

export function isAndroidHistoryRenderRuntime() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent || "";
  const bodyClassList = document?.body?.classList;
  return (
    /Android/i.test(ua) ||
    Boolean(window.AndroidBridge) ||
    bodyClassList?.contains("android-webview") ||
    bodyClassList?.contains("android-chrome")
  );
}

function isForcedAndroidPlatformOverride() {
  const override = getRuntimeSystemSettings().platformOverride;
  return (
    override === PLATFORM_OVERRIDE_MODES.androidChrome ||
    override === PLATFORM_OVERRIDE_MODES.androidWebView
  );
}

function isCompactHistoryViewport() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  if (document.body?.classList?.contains("mobile-mode")) return true;

  const settings = getRuntimeSystemSettings();
  const breakpoint = Number(settings.mobileBreakpoint);
  const limit =
    Number.isFinite(breakpoint) && breakpoint > 0 ? breakpoint : 768;
  const width = Math.min(
    window.visualViewport?.width || Number.POSITIVE_INFINITY,
    window.innerWidth || Number.POSITIVE_INFINITY,
    document.documentElement?.clientWidth || Number.POSITIVE_INFINITY
  );

  return Number.isFinite(width) && width > 0 && width <= limit;
}

export function shouldUseManualHistoryLoadMode() {
  if (isAndroidHistoryRenderRuntime()) return true;

  // PC 브라우저에서 Android 플랫폼을 강제 설정한 경우에는 실제 Android 런타임이 아니므로
  // 데스크톱 폭에서는 PC 자동 lazy load를 유지합니다. 단, 모바일 사이즈로 줄여
  // Android 모바일 UX를 검증할 때는 명시적 버튼 방식을 사용합니다.
  return isForcedAndroidPlatformOverride() && isCompactHistoryViewport();
}

function canElementScroll(element) {
  if (
    !element ||
    element === document.body ||
    element === document.documentElement
  ) {
    return false;
  }

  const style = window.getComputedStyle(element);
  const overflowY = `${style.overflowY || ""} ${style.overflow || ""}`;
  return (
    /(auto|scroll)/.test(overflowY) &&
    element.scrollHeight > element.clientHeight + 1
  );
}

export function getScrollableAncestors(target) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return [];
  }

  const result = [];
  let current = target?.parentElement || null;
  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    if (canElementScroll(current)) result.push(current);
    current = current.parentElement;
  }
  return result;
}

export function scrollElementToTarget(container, target, options = {}) {
  if (!container || !target) return false;

  const behavior = options.behavior || "auto";
  const offset = Number.isFinite(options.offset) ? options.offset : 16;
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop =
    container.scrollTop + targetRect.top - containerRect.top - offset;

  if (typeof container.scrollTo === "function") {
    container.scrollTo({top: Math.max(0, nextTop), behavior});
  } else {
    container.scrollTop = Math.max(0, nextTop);
  }
  return true;
}

export function applyWindowFallbackScroll(target, containerRect, options = {}) {
  if (!options.pageFallback || typeof window === "undefined") return;

  const behavior = options.behavior || "auto";
  const offset = Number.isFinite(options.offset) ? options.offset : 16;
  const targetRect = target.getBoundingClientRect();
  const viewportTop = containerRect?.top || 0;
  const delta = targetRect.top - viewportTop - offset;

  if (Math.abs(delta) < 1) return;
  window.scrollBy({top: delta, behavior});
}

export function countMermaidBlocksInText(value = "") {
  const matches = String(value || "").match(/```\s*mermaid/gi);
  return matches ? matches.length : 0;
}

export function isAssistantErrorMessage(message) {
  return Boolean(
    message?.role !== "user" &&
    (message?.status === "error" || message?.error === true)
  );
}
