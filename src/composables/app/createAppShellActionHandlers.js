import {nextTick} from "vue";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {authApiLive} from "@/api/live/authApi.live";
import {useAuthStore} from "@/stores/authStore";
import {resetAppBootstrapState} from "@/composables/app/useAppBootstrap";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {ROUTE_NAMES} from "@/constants/routeNames";

/**
 * @description AppShell과 ChatContainer에서 공통으로 쓰는 전역 메뉴 action 구현체입니다.
 * 차단 조건만 주입받아 동일한 UI/UX 동작을 한 곳에서 유지합니다.
 */
export function createAppShellActionHandlers({
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
  isBlocked = () => false,
  logScope = "appShellActions",
} = {}) {
  function shouldBlock() {
    return Boolean(isBlocked?.());
  }

  async function toggleTheme() {
    if (shouldBlock()) return;
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
      logWarn(`[${logScope}] toggleTheme 오류:`, error);
    }
  }

  function openSwagger() {
    if (shouldBlock()) return;
    router.push({name: ROUTE_NAMES.SWAGGER}).catch(() => {});
  }

  function openPlayground() {
    if (shouldBlock()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: ROUTE_NAMES.PLAYGROUND}).catch(() => {});
  }

  function openGuide() {
    if (shouldBlock()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: ROUTE_NAMES.GUIDE}).catch(() => {});
  }

  function openNotice() {
    if (shouldBlock()) return;
    navigationStore.setDrawerOpen(false);
    noticeOpen.value = true;
  }

  function openPrivacy() {
    if (shouldBlock()) return;
    navigationStore.setDrawerOpen(false);
    privacyOpen.value = true;
  }

  function openTerms() {
    if (shouldBlock()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: ROUTE_NAMES.TERMS}).catch(() => {});
  }

  function openPersonalization() {
    if (shouldBlock()) return;
    navigationStore.setDrawerOpen(false);
    personalizationOpen.value = true;
  }

  function openSystem() {
    if (shouldBlock()) return;
    navigationStore.setDrawerOpen(false);
    systemOpen.value = true;
  }

  function openLanguage() {
    if (shouldBlock()) return;
    languageSheetOpen.value = true;
  }

  function openSettings() {
    if (shouldBlock()) return;
    if (isMobile.value) {
      navigationStore.setDrawerOpen(false);
      mobileSettingsOpen.value = true;
      return;
    }
    openPersonalization();
  }

  async function logout() {
    if (shouldBlock()) return;
    try {
      await authApiLive.logout();
    } catch (error) {
      logWarn(`[${logScope}] logout 오류:`, error);
    } finally {
      resetAppBootstrapState();
      useAuthStore().resetAuth();
      navigationStore.setDrawerOpen(false);
      await router
        .replace({
          name: ROUTE_NAMES.LOGIN_REQUIRED,
          query: {reason: "LOGIN_REQUIRED"},
        })
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
