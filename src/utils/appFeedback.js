/**
 * @file utils/appFeedback.js
 * @description 여러 영역에서 공유하는 유틸리티입니다. DOM/Markdown/feedback/viewport 보정 등 공통 처리를 담당합니다.
 */

export const APP_CLIPBOARD_COPIED_EVENT = "app:clipboard-copied";
export const APP_TOAST_REQUESTED_EVENT = "app:toast-requested";

export const FEEDBACK_CHANNEL = Object.freeze({
  MOBILE_TOAST: "mobile-toast",
  DESKTOP_NOTE: "desktop-note",
});

export function shouldUseMobileFeedbackChannel(info = {}) {
  return Boolean(
    info.isNativeRuntime ||
    info.isNativeApp ||
    info.isAndroidApp ||
    info.isMobileBrowser
  );
}

export function getFeedbackChannel(info = {}) {
  return shouldUseMobileFeedbackChannel(info)
    ? FEEDBACK_CHANNEL.MOBILE_TOAST
    : FEEDBACK_CHANNEL.DESKTOP_NOTE;
}

export function dispatchAppFeedbackEvent(name, detail = {}, info = {}) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(name, {
      detail: {...detail, channel: getFeedbackChannel(info)},
    })
  );
}
