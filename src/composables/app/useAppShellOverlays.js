/**
 * @file composables/app/useAppShellOverlays.js
 * @description 공지/약관/개인화/시스템/언어/모바일 설정 같은 앱 shell overlay 상태를 제공합니다.
 */

import {ref} from "vue";

export function useAppShellOverlays() {
  const noticeOpen = ref(false);
  const privacyOpen = ref(false);
  const personalizationOpen = ref(false);
  const systemOpen = ref(false);
  const languageSheetOpen = ref(false);
  const mobileSettingsOpen = ref(false);

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

  function handleMobileSettingsDesktopOpen(target) {
    mobileSettingsOpen.value = false;
    if (target === "notice") {
      noticeOpen.value = true;
      return;
    }
    if (target === "privacy") {
      privacyOpen.value = true;
      return;
    }
    if (target === "personalization") {
      personalizationOpen.value = true;
      return;
    }
    if (target === "system") {
      systemOpen.value = true;
    }
  }

  return {
    noticeOpen,
    privacyOpen,
    personalizationOpen,
    systemOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    closeNotice,
    closePrivacy,
    closePersonalization,
    closeSystem,
    closeLanguageSheet,
    closeMobileSettings,
    handleMobileSettingsDesktopOpen,
  };
}
