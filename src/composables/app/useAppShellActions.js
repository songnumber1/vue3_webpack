/**
 * @file composables/app/useAppShellActions.js
 * @description theme/navigation/logout 비-overlay action을 direct import로 제공합니다. responseOverlay는 useResponseOverlay에서 관리합니다.
 */

import {computed, nextTick} from "vue";
import {useRouter} from "vue-router";
import {useAppContext} from "@/composables/app/useAppContext";
import {useAppShellLock} from "@/composables/app/useAppShellLock";
import {useAppShellThemeState} from "@/composables/app/useAppShellThemeState";
import {useRuntimeModeFlags} from "@/composables/app/useRuntimeModeFlags";
import {useNavigationStore} from "@/stores/navigationStore";
import {useAuthStore} from "@/stores/authStore";
import {authApiLive} from "@/api/live/authApi.live";
import {resetAppBootstrapState} from "@/composables/app/useAppBootstrap";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";

export function useAppShellActions(options = {}) {
  const router = options.router || useRouter();
  const {theme: contextTheme} = useAppContext();
  const theme = options.theme || contextTheme;
  const {themeName: contextThemeName} = useAppShellThemeState(theme?.current);
  const themeName = options.themeName || contextThemeName;
  const {shouldUseMobileLayout} = useRuntimeModeFlags();
  const navigationStore = options.navigationStore || useNavigationStore();
  const {isAppShellActionBlocked} = useAppShellLock();
  const isMobile =
    options.isMobile || computed(() => Boolean(shouldUseMobileLayout.value));
  const isBlocked = options.isBlocked || (() => isAppShellActionBlocked.value);
  const logScope = options.logScope || "useAppShellActions";

  function shouldBlock() {
    return Boolean(isBlocked?.());
  }

  async function toggleTheme() {
    if (shouldBlock()) return;
    try {
      if (!theme?.toggle) return;
      theme.toggle();
      if (themeName) themeName.value = theme.current;
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
      options.scrollBottom?.({stable: true});
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

  function openTerms() {
    if (shouldBlock()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: ROUTE_NAMES.TERMS}).catch(() => {});
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
    openGuide,
    openTerms,
    logout,
  };
}
