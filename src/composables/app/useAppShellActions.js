/**
 * @file composables/app/useAppShellActions.js
 * @description 앱 shell 전역 action을 제공합니다. UI 출력은 변경하지 않고 ChatContainer 중심 의존을 줄이기 위한 action 계층입니다.
 */

import {nextTick} from "vue";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {authApiLive} from "@/api/live/authApi.live";
import {useAuthStore} from "@/stores/authStore";
import {resetAppBootstrapState} from "@/composables/app/useAppBootstrap";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {useAppShellLock} from "@/composables/app/useAppShellLock";

export function useAppShellActions({
  router,
  theme,
  themeName,
  isMobile,
  navigationStore,
  noticeOpen,
  privacyOpen,
  personalizationOpen,
  systemOpen,
  languageSheetOpen,
  mobileSettingsOpen,
  scrollBottom,
}) {
  const {isAppShellActionBlocked} = useAppShellLock();

  function isBlocked() {
    return Boolean(isAppShellActionBlocked.value);
  }

  async function toggleTheme() {
    if (isBlocked()) return;
    try {
      theme.toggle();
      themeName.value = theme.current;
      await nextTick();
      if (
        isMermaidRenderingEnabledForPlatform(
          getRuntimeSystemSettings(),
          Boolean(isMobile?.value)
        )
      ) {
        await renderMermaidInElement(document.querySelector(".message-list"), {
          force: true,
        });
      }
      scrollBottom?.({stable: true});
    } catch (error) {
      logWarn("[useAppShellActions] toggleTheme 오류:", error);
    }
  }

  function openSwagger() {
    if (isBlocked()) return;
    router.push("/swagger").catch(() => {});
  }

  function openPlayground() {
    if (isBlocked()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "playground"}).catch(() => {});
  }

  function openGuide() {
    if (isBlocked()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "guide"}).catch(() => {});
  }

  function openNotice() {
    if (isBlocked()) return;
    navigationStore.setDrawerOpen(false);
    noticeOpen.value = true;
  }

  function openPrivacy() {
    if (isBlocked()) return;
    navigationStore.setDrawerOpen(false);
    privacyOpen.value = true;
  }

  function openTerms() {
    if (isBlocked()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "terms"}).catch(() => {});
  }

  function openPersonalization() {
    if (isBlocked()) return;
    navigationStore.setDrawerOpen(false);
    personalizationOpen.value = true;
  }

  function openSystem() {
    if (isBlocked()) return;
    navigationStore.setDrawerOpen(false);
    systemOpen.value = true;
  }

  function openLanguage() {
    if (isBlocked()) return;
    languageSheetOpen.value = true;
  }

  function openSettings() {
    if (isBlocked()) return;
    if (isMobile.value) {
      navigationStore.setDrawerOpen(false);
      mobileSettingsOpen.value = true;
      return;
    }
    openPersonalization();
  }

  async function logout() {
    if (isBlocked()) return;
    try {
      await authApiLive.logout();
    } catch (error) {
      logWarn("[useAppShellActions] logout 오류:", error);
    } finally {
      resetAppBootstrapState();
      useAuthStore().resetAuth();
      navigationStore.setDrawerOpen(false);
      await router
        .replace({name: "login-required", query: {reason: "LOGIN_REQUIRED"}})
        .catch(() => {});
    }
  }

  return {
    toggleTheme,
    openSwagger,
    openPlayground,
    openSettings,
    openGuide,
    openNotice,
    openPrivacy,
    openTerms,
    openPersonalization,
    openSystem,
    openLanguage,
    logout,
  };
}
