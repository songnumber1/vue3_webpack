/**
 * @file composables/overlay/useOverlayBackClose.js
 * @description URL을 변경하지 않는 상세/팝업의 브라우저 뒤로가기 닫기 동작을 제공합니다.
 */
import {nextTick, onBeforeUnmount, unref, watch} from "vue";

const DEFAULT_HISTORY_KEY = "__appOverlayBackClose";

function canUseBrowserHistory() {
  return typeof window !== "undefined" && Boolean(window.history);
}

function stopPopState(event) {
  if (!event) return;
  if (typeof event.stopImmediatePropagation === "function") {
    event.stopImmediatePropagation();
    return;
  }
  if (typeof event.stopPropagation === "function") {
    event.stopPropagation();
  }
}

function resolveBoolean(source) {
  return Boolean(unref(source));
}

export function useOverlayBackClose({
  isOpen,
  close,
  enabled = true,
  historyKey = DEFAULT_HISTORY_KEY,
  historyValue = true,
} = {}) {
  if (typeof close !== "function") {
    throw new Error("useOverlayBackClose requires a close function.");
  }

  let historyPushed = false;
  let restoringHistory = false;
  let closingFromPopState = false;

  function shouldUseHistory() {
    return canUseBrowserHistory() && resolveBoolean(enabled);
  }

  function pushHistoryOnce() {
    if (!shouldUseHistory()) return;
    if (!resolveBoolean(isOpen)) return;
    if (historyPushed) return;

    window.history.pushState(
      {
        ...(window.history.state || {}),
        [historyKey]: historyValue,
      },
      "",
      window.location.href
    );
    historyPushed = true;
  }

  function restoreHistoryIfNeeded() {
    if (!canUseBrowserHistory()) return false;
    if (!historyPushed) return false;

    restoringHistory = true;
    window.history.back();
    return true;
  }

  function clearHistoryFlags() {
    historyPushed = false;
    restoringHistory = false;
  }

  function handlePopState(event) {
    if (restoringHistory && historyPushed) {
      stopPopState(event);
      clearHistoryFlags();
      return;
    }

    if (!historyPushed || !resolveBoolean(isOpen)) return;

    stopPopState(event);
    closingFromPopState = true;
    close();
    clearHistoryFlags();

    nextTick(() => {
      closingFromPopState = false;
    });
  }

  if (typeof window !== "undefined") {
    window.addEventListener("popstate", handlePopState, {capture: true});
  }

  const stopOpenWatch = watch(
    () => resolveBoolean(isOpen),
    (open) => {
      if (open) {
        pushHistoryOnce();
        return;
      }

      if (closingFromPopState || restoringHistory) return;
      restoreHistoryIfNeeded();
    }
  );

  const stopEnabledWatch = watch(
    () => resolveBoolean(enabled),
    (active) => {
      if (active) {
        pushHistoryOnce();
        return;
      }

      restoreHistoryIfNeeded();
    }
  );

  onBeforeUnmount(() => {
    stopOpenWatch();
    stopEnabledWatch();
    if (typeof window !== "undefined") {
      window.removeEventListener("popstate", handlePopState, {capture: true});
    }
  });
}
