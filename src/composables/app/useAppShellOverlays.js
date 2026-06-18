/**
 * @file composables/app/useAppShellOverlays.js
 * @description 공지/약관/개인화/시스템/언어/모바일 설정 같은 앱 shell overlay 상태를 제공합니다.
 */

import {computed, ref} from "vue";
import {APP_OVERLAY_TYPES} from "@/constants/appOverlayTypes";

const noticeOpen = ref(false);
const privacyOpen = ref(false);
const personalizationOpen = ref(false);
const systemOpen = ref(false);
const languageSheetOpen = ref(false);
const mobileSettingsOpen = ref(false);

export function useAppShellOverlays() {
  const isAnyOverlayOpen = computed(
    () =>
      noticeOpen.value ||
      privacyOpen.value ||
      personalizationOpen.value ||
      systemOpen.value ||
      languageSheetOpen.value ||
      mobileSettingsOpen.value
  );

  const activeOverlayType = computed(() => {
    if (noticeOpen.value) return APP_OVERLAY_TYPES.NOTICE;
    if (privacyOpen.value) return APP_OVERLAY_TYPES.PRIVACY;
    if (personalizationOpen.value) return APP_OVERLAY_TYPES.PERSONALIZATION;
    if (systemOpen.value) return APP_OVERLAY_TYPES.SYSTEM;
    if (languageSheetOpen.value) return APP_OVERLAY_TYPES.LANGUAGE;
    if (mobileSettingsOpen.value) return APP_OVERLAY_TYPES.MOBILE_SETTINGS;
    return null;
  });

  function closeNotice() {
    noticeOpen.value = false;
  }

  function closePrivacy() {
    privacyOpen.value = false;
  }

  function closePersonalization() {
    personalizationOpen.value = false;
  }

  function closeSystem() {
    systemOpen.value = false;
  }

  function closeLanguageSheet() {
    languageSheetOpen.value = false;
  }

  function closeMobileSettings() {
    mobileSettingsOpen.value = false;
  }

  function closeActiveOverlayOnly() {
    closeNotice();
    closePrivacy();
    closePersonalization();
    closeSystem();
    closeLanguageSheet();
    closeMobileSettings();
  }

  function closeAppOverlay(type) {
    if (type === APP_OVERLAY_TYPES.NOTICE) {
      closeNotice();
      return;
    }
    if (type === APP_OVERLAY_TYPES.PRIVACY) {
      closePrivacy();
      return;
    }
    if (type === APP_OVERLAY_TYPES.PERSONALIZATION) {
      closePersonalization();
      return;
    }
    if (type === APP_OVERLAY_TYPES.SYSTEM) {
      closeSystem();
      return;
    }
    if (type === APP_OVERLAY_TYPES.LANGUAGE) {
      closeLanguageSheet();
      return;
    }
    if (type === APP_OVERLAY_TYPES.MOBILE_SETTINGS) {
      closeMobileSettings();
    }
  }

  function openAppOverlay(type) {
    if (type === APP_OVERLAY_TYPES.NOTICE) {
      noticeOpen.value = true;
      return;
    }
    if (type === APP_OVERLAY_TYPES.PRIVACY) {
      privacyOpen.value = true;
      return;
    }
    if (type === APP_OVERLAY_TYPES.PERSONALIZATION) {
      personalizationOpen.value = true;
      return;
    }
    if (type === APP_OVERLAY_TYPES.SYSTEM) {
      systemOpen.value = true;
      return;
    }
    if (type === APP_OVERLAY_TYPES.LANGUAGE) {
      languageSheetOpen.value = true;
      return;
    }
    if (type === APP_OVERLAY_TYPES.MOBILE_SETTINGS) {
      mobileSettingsOpen.value = true;
    }
  }

  function handleMobileSettingsDesktopOpen(target) {
    closeMobileSettings();
    openAppOverlay(target);
  }

  return {
    APP_OVERLAY_TYPES,
    noticeOpen,
    privacyOpen,
    personalizationOpen,
    systemOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    isAnyOverlayOpen,
    activeOverlayType,
    openAppOverlay,
    closeAppOverlay,
    closeActiveOverlayOnly,
    closeNotice,
    closePrivacy,
    closePersonalization,
    closeSystem,
    closeLanguageSheet,
    closeMobileSettings,
    handleMobileSettingsDesktopOpen,
  };
}
