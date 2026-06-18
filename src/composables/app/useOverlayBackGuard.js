/**
 * @file composables/app/useOverlayBackGuard.js
 * @description URL/라우터 변경 없이 모바일 fullscreen overlay의 뒤로가기 1회를 overlay 닫기로 소비합니다.
 */

import {onBeforeUnmount, watch} from "vue";
import {useAppOverlayBackStore} from "@/stores/appOverlayBackStore";

const OVERLAY_HISTORY_KEY = "__appOverlayBack";

function canUseBrowserHistory() {
  return typeof window !== "undefined" && Boolean(window.history);
}

function stopRouterPopStateSideEffects(event) {
  if (!event) return;
  if (typeof event.stopImmediatePropagation === "function") {
    event.stopImmediatePropagation();
    return;
  }
  if (typeof event.stopPropagation === "function") {
    event.stopPropagation();
  }
}

export function useOverlayBackGuard({
  isMobile,
  isAnyOverlayOpen,
  activeOverlayType,
  closeActiveOverlayOnly,
  shouldSuppressChatRouteLoad,
  suppressChatRouteLoadId,
} = {}) {
  const overlayBackStore = useAppOverlayBackStore();

  function pushOverlayHistoryOnce(type) {
    if (!canUseBrowserHistory()) return;
    if (!isMobile?.value) return;
    if (!isAnyOverlayOpen?.value) return;
    if (overlayBackStore.mobileHistoryPushed) return;

    const overlayType = type || activeOverlayType?.value || true;

    window.history.pushState(
      {
        ...(window.history.state || {}),
        [OVERLAY_HISTORY_KEY]: overlayType,
      },
      "",
      window.location.href
    );

    overlayBackStore.markMobileHistoryPushed(overlayType);
  }

  function popOverlayHistoryForClose() {
    if (!canUseBrowserHistory()) return false;
    if (!overlayBackStore.mobileHistoryPushed) return false;

    // close 버튼으로 더미 history를 소비하는 경우 Vue Router의 popstate
    // listener가 먼저 반응할 수 있으므로, back 호출 전에 채팅 route load
    // 1회 차단 플래그를 먼저 세워 둡니다.
    markChatRouteLoadSuppressedIfNeeded();
    window.history.back();
    return true;
  }

  function restoreOverlayHistoryIfNeeded() {
    if (!canUseBrowserHistory()) return false;
    if (!overlayBackStore.mobileHistoryPushed) return false;

    overlayBackStore.markRestoringMobileHistory();
    window.history.back();
    return true;
  }

  function clearOverlayBackState() {
    overlayBackStore.clearOverlayBackState();
  }

  function markChatRouteLoadSuppressedIfNeeded() {
    if (shouldSuppressChatRouteLoad?.value === false) return;
    overlayBackStore.markSuppressNextChatRouteLoad(
      suppressChatRouteLoadId?.value || null
    );
  }

  function handlePopState(event) {
    /**
     * Only consume popstate events that belong to the overlay dummy history
     * entry. PC dialog overlays do not push a dummy entry, so a normal browser
     * Back on desktop must remain a real router/browser navigation.
     */
    const shouldConsumeForOverlay =
      overlayBackStore.mobileHistoryPushed ||
      overlayBackStore.restoringMobileHistory;

    if (shouldConsumeForOverlay) {
      stopRouterPopStateSideEffects(event);
    }

    if (overlayBackStore.restoringMobileHistory) {
      overlayBackStore.clearRestoringMobileHistory();
      overlayBackStore.clearMobileHistoryPushed();
      overlayBackStore.setActiveOverlayType(activeOverlayType?.value || null);
      return;
    }

    if (!isAnyOverlayOpen?.value) {
      clearOverlayBackState();
      return;
    }

    markChatRouteLoadSuppressedIfNeeded();

    if (typeof closeActiveOverlayOnly === "function") {
      closeActiveOverlayOnly();
    }
    clearOverlayBackState();
  }

  function closeOverlayByBackOrDirect(closeDirect) {
    if (overlayBackStore.mobileHistoryPushed) {
      popOverlayHistoryForClose();
      return;
    }

    if (typeof closeDirect === "function") {
      closeDirect();
    } else if (typeof closeActiveOverlayOnly === "function") {
      closeActiveOverlayOnly();
    }
    clearOverlayBackState();
  }

  const stopMobileWatcher = watch(
    () => Boolean(isMobile?.value),
    (mobile) => {
      if (mobile) {
        pushOverlayHistoryOnce(activeOverlayType?.value);
        return;
      }

      restoreOverlayHistoryIfNeeded();
    }
  );

  const stopOpenWatcher = watch(
    () => Boolean(isAnyOverlayOpen?.value),
    (open) => {
      if (open) {
        pushOverlayHistoryOnce(activeOverlayType?.value);
        return;
      }

      if (!overlayBackStore.restoringMobileHistory) {
        clearOverlayBackState();
      }
    }
  );

  const stopTypeWatcher = watch(
    () => activeOverlayType?.value || null,
    (type) => {
      overlayBackStore.setActiveOverlayType(type);
    },
    {immediate: true}
  );

  if (typeof window !== "undefined") {
    window.addEventListener("popstate", handlePopState, {capture: true});
  }

  onBeforeUnmount(() => {
    stopMobileWatcher();
    stopOpenWatcher();
    stopTypeWatcher();

    if (typeof window !== "undefined") {
      window.removeEventListener("popstate", handlePopState, {capture: true});
    }
  });

  return {
    pushOverlayHistoryOnce,
    closeOverlayByBackOrDirect,
    restoreOverlayHistoryIfNeeded,
  };
}
