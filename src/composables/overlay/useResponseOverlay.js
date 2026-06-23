/**
 * @file composables/overlay/useResponseOverlay.js
 * @description responseOverlay 계열 공지/개인정보/개인화/시스템/언어/모바일 설정 open/close와 모바일 back 처리를 한 곳에서 관리합니다.
 *
 * responseOverlay 렌더링과 모바일 back 처리를 이 composable 하나에서 통합 관리합니다.
 */

import {computed, markRaw, ref, unref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useAppOverlayBackStore} from "@/stores/appOverlayBackStore";
import {useAppShellLock} from "@/composables/app/useAppShellLock";
import {useNavigationStore} from "@/stores/navigationStore";
import {useViewportStore} from "@/stores/viewportStore";
import LanguageSelectSheet from "@/components/menu/LanguageSelectSheet.vue";
import MobileSettingsPanel from "@/views/settings/MobileSettingsPanel.vue";
import NoticeView from "@/views/settings/NoticeView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";
import PrivacyPolicyView from "@/views/settings/PrivacyPolicyView.vue";
import SystemSettingsView from "@/views/settings/SystemSettingsView.vue";

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

const activeType = ref(null);
const configuredIsMobile = ref(null);
const suppressChatRouteLoad = ref(false);
const suppressChatRouteLoadId = ref(null);
let popstateBound = false;
let overlayBackStoreInstance = null;
let guardWatchersBound = false;

const RESPONSE_OVERLAY_RENDER_MODES = Object.freeze({
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

const RESPONSE_OVERLAY_COMPONENTS = Object.freeze({
  [APP_OVERLAY_TYPES.NOTICE]: markRaw(NoticeView),
  [APP_OVERLAY_TYPES.PRIVACY]: markRaw(PrivacyPolicyView),
  [APP_OVERLAY_TYPES.PERSONALIZATION]: markRaw(PersonalizationView),
  [APP_OVERLAY_TYPES.SYSTEM]: markRaw(SystemSettingsView),
  [APP_OVERLAY_TYPES.LANGUAGE]: markRaw(LanguageSelectSheet),
  [APP_OVERLAY_TYPES.MOBILE_SETTINGS]: markRaw(MobileSettingsPanel),
});

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
  activeType.value = null;
}

function handlePopState(event) {
  const overlayBackStore = resolveOverlayBackStore();

  // responseOverlay(activeType)가 열려 있을 때만 popstate를 소비합니다.
  if (!activeType.value) return;

  const shouldConsumeForOverlay =
    overlayBackStore.mobileHistoryPushed ||
    overlayBackStore.restoringMobileHistory;

  if (shouldConsumeForOverlay) {
    stopRouterPopStateSideEffects(event);
  }

  if (overlayBackStore.restoringMobileHistory) {
    overlayBackStore.clearRestoringMobileHistory();
    overlayBackStore.clearMobileHistoryPushed();
    overlayBackStore.setActiveOverlayType(activeType.value || null);
    return;
  }

  if (!activeType.value) {
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
  if (!activeType.value) return;
  if (overlayBackStore.mobileHistoryPushed) return;

  const overlayType = type || activeType.value || true;

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

function closeOverlayByBackOrDirect(closeDirect) {
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

function bindBackGuardWatchers(viewportStore) {
  if (guardWatchersBound) return;
  guardWatchersBound = true;

  watch(
    () => shouldUseMobileBack(viewportStore),
    (mobile) => {
      if (mobile) {
        pushOverlayHistoryOnce(activeType.value, viewportStore);
        return;
      }

      restoreOverlayHistoryIfNeeded();
    }
  );

  watch(
    () => Boolean(activeType.value),
    (open) => {
      const overlayBackStore = resolveOverlayBackStore();

      if (open) {
        pushOverlayHistoryOnce(activeType.value, viewportStore);
        return;
      }

      if (!overlayBackStore.restoringMobileHistory) {
        clearOverlayBackState();
      }
    }
  );

  watch(
    () => activeType.value || null,
    (type) => {
      resolveOverlayBackStore().setActiveOverlayType(type);
    },
    {immediate: true}
  );
}

function openActiveOverlay(type, viewportStore, navigationStore) {
  if (!RESPONSE_OVERLAY_TYPE_VALUES.includes(type)) return;

  navigationStore?.setDrawerOpen?.(false);
  activeType.value = type;
  resolveOverlayBackStore().setActiveOverlayType(type);
  pushOverlayHistoryOnce(type, viewportStore);
}

function closeActiveOverlay(type = null) {
  if (!type || activeType.value === type) {
    activeType.value = null;
  }
  clearOverlayBackState();
}

function createTitleGetter(t) {
  return computed(() => {
    if (activeType.value === APP_OVERLAY_TYPES.NOTICE) return t("notice.title");
    if (activeType.value === APP_OVERLAY_TYPES.PRIVACY) {
      return t("legal.privacy.title");
    }
    if (activeType.value === APP_OVERLAY_TYPES.PERSONALIZATION) {
      return t("personalization.title");
    }
    if (activeType.value === APP_OVERLAY_TYPES.SYSTEM) return t("common.system");
    if (activeType.value === APP_OVERLAY_TYPES.LANGUAGE) {
      return t("common.language");
    }
    if (activeType.value === APP_OVERLAY_TYPES.MOBILE_SETTINGS) {
      return t("common.settings");
    }
    return "";
  });
}

function createSubtitleGetter(t) {
  return computed(() => {
    if (activeType.value === APP_OVERLAY_TYPES.NOTICE) {
      return t("notice.subtitle");
    }
    if (activeType.value === APP_OVERLAY_TYPES.PRIVACY) {
      return t("legal.privacy.description");
    }
    if (activeType.value === APP_OVERLAY_TYPES.PERSONALIZATION) {
      return t("personalization.subtitle");
    }
    if (activeType.value === APP_OVERLAY_TYPES.SYSTEM) {
      return t("menu.systemSummary");
    }
    return "";
  });
}

export function useResponseOverlay(options = {}) {
  const {t} = useI18n();
  const navigationStore = useNavigationStore();
  const viewportStore = useViewportStore();
  const {isAppShellActionBlocked} = useAppShellLock();

  if (Object.prototype.hasOwnProperty.call(options, "isMobile")) {
    configuredIsMobile.value = options.isMobile;
  }
  if (Object.prototype.hasOwnProperty.call(options, "shouldSuppressChatRouteLoad")) {
    suppressChatRouteLoad.value = options.shouldSuppressChatRouteLoad;
  }
  if (Object.prototype.hasOwnProperty.call(options, "suppressChatRouteLoadId")) {
    suppressChatRouteLoadId.value = options.suppressChatRouteLoadId;
  }

  if (options.enableBackGuard === true) {
    ensurePopstateListener();
    bindBackGuardWatchers(viewportStore);
  }

  const isOpen = computed(() => Boolean(activeType.value));
  const isMobile = computed(() => shouldUseMobileBack(viewportStore));
  const activeOverlayType = computed(() => activeType.value);
  const overlayComponent = computed(
    () => RESPONSE_OVERLAY_COMPONENTS[activeType.value] || null
  );
  const overlayTitle = createTitleGetter(t);
  const overlaySubtitle = createSubtitleGetter(t);
  const overlayRenderMode = computed(() => {
    if (RESPONSIVE_OVERLAY_TYPES.includes(activeType.value)) {
      return RESPONSE_OVERLAY_RENDER_MODES.RESPONSIVE;
    }
    if (STANDALONE_OVERLAY_TYPES.includes(activeType.value)) {
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
    activeType.value === APP_OVERLAY_TYPES.SYSTEM
      ? "responsive-panel--system-settings"
      : ""
  );

  function openResponseOverlay(type, {ignoreBlock = false} = {}) {
    if (!ignoreBlock && isAppShellActionBlocked.value) return;
    openActiveOverlay(type, viewportStore, navigationStore);
  }

  function closeResponseOverlay(type = null) {
    closeActiveOverlay(type);
  }

  function closeResponseOverlayByBackOrDirect(closeDirect) {
    closeOverlayByBackOrDirect(closeDirect);
  }

  function openNotice() {
    openResponseOverlay(APP_OVERLAY_TYPES.NOTICE);
  }

  function openPrivacy() {
    openResponseOverlay(APP_OVERLAY_TYPES.PRIVACY);
  }

  function openPersonalization() {
    openResponseOverlay(APP_OVERLAY_TYPES.PERSONALIZATION);
  }

  function openSystem() {
    openResponseOverlay(APP_OVERLAY_TYPES.SYSTEM);
  }

  function openLanguage() {
    openResponseOverlay(APP_OVERLAY_TYPES.LANGUAGE);
  }

  function openMobileSettings() {
    openResponseOverlay(APP_OVERLAY_TYPES.MOBILE_SETTINGS);
  }

  function openSettings() {
    if (isMobile.value) {
      openMobileSettings();
      return;
    }
    openPersonalization();
  }

  function handleMobileSettingsDesktopOpen(target) {
    if (!RESPONSE_OVERLAY_TYPE_VALUES.includes(target)) return;

    const overlayBackStore = resolveOverlayBackStore();
    activeType.value = target;
    overlayBackStore.setActiveOverlayType(target);

    // 모바일 설정 페이지가 열린 상태에서 PC 레이아웃으로 전환되면
    // 기존 모바일 history dummy를 제거하되, 새 desktop overlay는 유지합니다.
    if (overlayBackStore.mobileHistoryPushed && canUseBrowserHistory()) {
      overlayBackStore.markRestoringMobileHistory();
      window.history.back();
    }
  }

  return {
    APP_OVERLAY_TYPES,
    activeType,
    activeOverlayType,
    isOpen,
    isMobile,
    overlayComponent,
    overlayTitle,
    overlaySubtitle,
    overlayRenderMode,
    usesResponsiveOverlay,
    usesStandaloneOverlay,
    overlayPanelClass,
    openResponseOverlay,
    closeResponseOverlay,
    closeResponseOverlayByBackOrDirect,
    openNotice,
    openPrivacy,
    openPersonalization,
    openSystem,
    openLanguage,
    openMobileSettings,
    openSettings,
    handleMobileSettingsDesktopOpen,
  };
}
