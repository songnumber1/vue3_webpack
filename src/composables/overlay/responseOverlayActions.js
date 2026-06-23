/**
 * @file composables/overlay/responseOverlayActions.js
 * @description responseOverlay 상태, open/close action, 모바일 back 정책을 named function으로 제공합니다.
 */

import {computed, ref, unref, watch} from "vue";
import {useAppOverlayBackStore} from "@/stores/appOverlayBackStore";

const RESPONSE_OVERLAY_HISTORY_KEY = "__responseOverlayBack";

export const APP_OVERLAY_TYPES = Object.freeze({
  NOTICE: "notice",
  PRIVACY: "privacy",
  PERSONALIZATION: "personalization",
  SYSTEM: "system",
  LANGUAGE: "language",
  MOBILE_SETTINGS: "mobile-settings",
});

const RESPONSE_OVERLAY_TYPE_VALUES = Object.freeze(
  Object.values(APP_OVERLAY_TYPES)
);

export const RESPONSE_OVERLAY_RENDER_MODES = Object.freeze({
  RESPONSIVE: "responsive",
  STANDALONE: "standalone",
});

const RESPONSIVE_OVERLAY_TYPES = Object.freeze([
  APP_OVERLAY_TYPES.NOTICE,
  APP_OVERLAY_TYPES.PRIVACY,
  APP_OVERLAY_TYPES.PERSONALIZATION,
  APP_OVERLAY_TYPES.SYSTEM,
]);

const STANDALONE_OVERLAY_TYPES = Object.freeze([
  APP_OVERLAY_TYPES.LANGUAGE,
  APP_OVERLAY_TYPES.MOBILE_SETTINGS,
]);

export const responseOverlayActiveType = ref(null);
const configuredIsMobile = ref(null);
const suppressChatRouteLoad = ref(false);
const suppressChatRouteLoadId = ref(null);
let popstateBound = false;
let overlayBackStoreInstance = null;
let guardWatchersBound = false;

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

function resolveOverlayBackStore() {
  if (!overlayBackStoreInstance) {
    overlayBackStoreInstance = useAppOverlayBackStore();
  }
  return overlayBackStoreInstance;
}

function shouldUseMobileBack(viewportStore) {
  const injectedMobile = unref(configuredIsMobile.value);
  if (typeof injectedMobile === "boolean") return injectedMobile;
  return Boolean(viewportStore?.isCompact);
}

function markChatRouteLoadSuppressedIfNeeded() {
  if (!unref(suppressChatRouteLoad.value)) return;

  resolveOverlayBackStore().markSuppressNextChatRouteLoad(
    unref(suppressChatRouteLoadId.value) || null
  );
}

function clearOverlayBackState() {
  resolveOverlayBackStore().clearOverlayBackState();
}

function closeActiveTypeOnly() {
  responseOverlayActiveType.value = null;
}

function handlePopState(event) {
  const overlayBackStore = resolveOverlayBackStore();

  if (!responseOverlayActiveType.value) return;

  const shouldConsumeForOverlay =
    overlayBackStore.mobileHistoryPushed ||
    overlayBackStore.restoringMobileHistory;

  if (shouldConsumeForOverlay) {
    stopRouterPopStateSideEffects(event);
  }

  if (overlayBackStore.restoringMobileHistory) {
    overlayBackStore.clearRestoringMobileHistory();
    overlayBackStore.clearMobileHistoryPushed();
    overlayBackStore.setActiveOverlayType(
      responseOverlayActiveType.value || null
    );
    return;
  }

  if (!responseOverlayActiveType.value) {
    clearOverlayBackState();
    return;
  }

  markChatRouteLoadSuppressedIfNeeded();
  closeActiveTypeOnly();
  clearOverlayBackState();
}

function ensurePopstateListener() {
  if (popstateBound || typeof window === "undefined") return;
  window.addEventListener("popstate", handlePopState, {capture: true});
  popstateBound = true;
}

function pushOverlayHistoryOnce(type, viewportStore) {
  const overlayBackStore = resolveOverlayBackStore();

  if (!canUseBrowserHistory()) return;
  if (!shouldUseMobileBack(viewportStore)) return;
  if (!responseOverlayActiveType.value) return;
  if (overlayBackStore.mobileHistoryPushed) return;

  const overlayType = type || responseOverlayActiveType.value || true;

  window.history.pushState(
    {
      ...(window.history.state || {}),
      [RESPONSE_OVERLAY_HISTORY_KEY]: overlayType,
    },
    "",
    window.location.href
  );

  overlayBackStore.markMobileHistoryPushed(overlayType);
}

function restoreOverlayHistoryIfNeeded() {
  const overlayBackStore = resolveOverlayBackStore();

  if (!canUseBrowserHistory()) return false;
  if (!overlayBackStore.mobileHistoryPushed) return false;

  overlayBackStore.markRestoringMobileHistory();
  window.history.back();
  return true;
}

function isBlocked(isBlockedInput) {
  if (typeof isBlockedInput === "function") return Boolean(isBlockedInput());
  return Boolean(unref(isBlockedInput));
}

export function configureResponseOverlay(options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, "isMobile")) {
    configuredIsMobile.value = options.isMobile;
  }
  if (
    Object.prototype.hasOwnProperty.call(options, "shouldSuppressChatRouteLoad")
  ) {
    suppressChatRouteLoad.value = options.shouldSuppressChatRouteLoad;
  }
  if (
    Object.prototype.hasOwnProperty.call(options, "suppressChatRouteLoadId")
  ) {
    suppressChatRouteLoadId.value = options.suppressChatRouteLoadId;
  }
}

export function setupResponseOverlayBackGuard(viewportStore) {
  ensurePopstateListener();

  if (guardWatchersBound) return;
  guardWatchersBound = true;

  watch(
    () => shouldUseMobileBack(viewportStore),
    (mobile) => {
      if (mobile) {
        pushOverlayHistoryOnce(responseOverlayActiveType.value, viewportStore);
        return;
      }

      restoreOverlayHistoryIfNeeded();
    }
  );

  watch(
    () => Boolean(responseOverlayActiveType.value),
    (open) => {
      const overlayBackStore = resolveOverlayBackStore();

      if (open) {
        pushOverlayHistoryOnce(responseOverlayActiveType.value, viewportStore);
        return;
      }

      if (!overlayBackStore.restoringMobileHistory) {
        clearOverlayBackState();
      }
    }
  );

  watch(
    () => responseOverlayActiveType.value || null,
    (type) => {
      resolveOverlayBackStore().setActiveOverlayType(type);
    },
    {immediate: true}
  );
}

export function createResponseOverlayViewState(t, viewportStore) {
  const isOpen = computed(() => Boolean(responseOverlayActiveType.value));
  const isMobile = computed(() => shouldUseMobileBack(viewportStore));
  const activeOverlayType = computed(() => responseOverlayActiveType.value);
  const overlayTitle = computed(() => {
    if (responseOverlayActiveType.value === APP_OVERLAY_TYPES.NOTICE) {
      return t("notice.title");
    }
    if (responseOverlayActiveType.value === APP_OVERLAY_TYPES.PRIVACY) {
      return t("legal.privacy.title");
    }
    if (responseOverlayActiveType.value === APP_OVERLAY_TYPES.PERSONALIZATION) {
      return t("personalization.title");
    }
    if (responseOverlayActiveType.value === APP_OVERLAY_TYPES.SYSTEM) {
      return t("common.system");
    }
    if (responseOverlayActiveType.value === APP_OVERLAY_TYPES.LANGUAGE) {
      return t("common.language");
    }
    if (responseOverlayActiveType.value === APP_OVERLAY_TYPES.MOBILE_SETTINGS) {
      return t("common.settings");
    }
    return "";
  });
  const overlaySubtitle = computed(() => {
    if (responseOverlayActiveType.value === APP_OVERLAY_TYPES.NOTICE) {
      return t("notice.subtitle");
    }
    if (responseOverlayActiveType.value === APP_OVERLAY_TYPES.PRIVACY) {
      return t("legal.privacy.description");
    }
    if (responseOverlayActiveType.value === APP_OVERLAY_TYPES.PERSONALIZATION) {
      return t("personalization.subtitle");
    }
    if (responseOverlayActiveType.value === APP_OVERLAY_TYPES.SYSTEM) {
      return t("menu.systemSummary");
    }
    return "";
  });
  const overlayRenderMode = computed(() => {
    if (RESPONSIVE_OVERLAY_TYPES.includes(responseOverlayActiveType.value)) {
      return RESPONSE_OVERLAY_RENDER_MODES.RESPONSIVE;
    }
    if (STANDALONE_OVERLAY_TYPES.includes(responseOverlayActiveType.value)) {
      return RESPONSE_OVERLAY_RENDER_MODES.STANDALONE;
    }
    return null;
  });
  const usesResponsiveOverlay = computed(
    () => overlayRenderMode.value === RESPONSE_OVERLAY_RENDER_MODES.RESPONSIVE
  );
  const usesStandaloneOverlay = computed(
    () => overlayRenderMode.value === RESPONSE_OVERLAY_RENDER_MODES.STANDALONE
  );
  const overlayPanelClass = computed(() =>
    responseOverlayActiveType.value === APP_OVERLAY_TYPES.SYSTEM
      ? "responsive-panel--system-settings"
      : ""
  );

  return {
    activeOverlayType,
    isOpen,
    isMobile,
    overlayTitle,
    overlaySubtitle,
    overlayRenderMode,
    usesResponsiveOverlay,
    usesStandaloneOverlay,
    overlayPanelClass,
  };
}

export function openResponseOverlay(
  type,
  {ignoreBlock = false, isBlocked: blocked, viewportStore, navigationStore} = {}
) {
  if (!RESPONSE_OVERLAY_TYPE_VALUES.includes(type)) return;
  if (!ignoreBlock && isBlocked(blocked)) return;

  navigationStore?.setDrawerOpen?.(false);
  responseOverlayActiveType.value = type;
  resolveOverlayBackStore().setActiveOverlayType(type);
  pushOverlayHistoryOnce(type, viewportStore);
}

export function closeResponseOverlay(type = null) {
  if (!type || responseOverlayActiveType.value === type) {
    responseOverlayActiveType.value = null;
  }
  clearOverlayBackState();
}

export function closeResponseOverlayByBackOrDirect(closeDirect) {
  const overlayBackStore = resolveOverlayBackStore();

  if (overlayBackStore.mobileHistoryPushed && canUseBrowserHistory()) {
    markChatRouteLoadSuppressedIfNeeded();
    window.history.back();
    return;
  }

  if (typeof closeDirect === "function") {
    closeDirect();
  } else {
    closeActiveTypeOnly();
  }

  clearOverlayBackState();
}

export function openNoticeOverlay(options) {
  openResponseOverlay(APP_OVERLAY_TYPES.NOTICE, options);
}

export function openPrivacyOverlay(options) {
  openResponseOverlay(APP_OVERLAY_TYPES.PRIVACY, options);
}

export function openPersonalizationOverlay(options) {
  openResponseOverlay(APP_OVERLAY_TYPES.PERSONALIZATION, options);
}

export function openSystemOverlay(options) {
  openResponseOverlay(APP_OVERLAY_TYPES.SYSTEM, options);
}

export function openLanguageOverlay(options) {
  openResponseOverlay(APP_OVERLAY_TYPES.LANGUAGE, options);
}

export function openMobileSettingsOverlay(options) {
  openResponseOverlay(APP_OVERLAY_TYPES.MOBILE_SETTINGS, options);
}

export function openSettingsOverlay(options = {}) {
  const mobile = unref(options.isMobile);
  if (mobile) {
    openMobileSettingsOverlay(options);
    return;
  }
  openPersonalizationOverlay(options);
}

export function handleMobileSettingsDesktopOpen(target) {
  if (!RESPONSE_OVERLAY_TYPE_VALUES.includes(target)) return;

  const overlayBackStore = resolveOverlayBackStore();
  responseOverlayActiveType.value = target;
  overlayBackStore.setActiveOverlayType(target);

  if (overlayBackStore.mobileHistoryPushed && canUseBrowserHistory()) {
    overlayBackStore.markRestoringMobileHistory();
    window.history.back();
  }
}
