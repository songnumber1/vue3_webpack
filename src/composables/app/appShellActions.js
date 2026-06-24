/**
 * @file composables/app/appShellActions.js
 * @description App shell 공통 action을 hook wrapper 없이 named function으로 제공합니다.
 */

import {nextTick} from "vue";
import {authApiLive} from "@/api/live/authApi.live";
import {resetAppBootstrapState} from "@/composables/app/appBootstrapState";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {closeNavigationDrawer} from "@/actions/navigation/navigationUiActions";
import {useAuthStore} from "@/stores/authStore";
import {resolveBlocked} from "@/utils/interactionGuard";

export async function toggleThemeAction({
  theme,
  themeName,
  isMobile,
  scrollBottom,
  isBlocked,
  logScope = "appShellActions",
} = {}) {
  if (resolveBlocked(isBlocked)) return;
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
    scrollBottom?.({stable: true});
  } catch (error) {
    logWarn(`[${logScope}] toggleTheme 오류:`, error);
  }
}

export function openSwaggerRoute({router, isBlocked} = {}) {
  if (resolveBlocked(isBlocked)) return;
  router?.push({name: ROUTE_NAMES.SWAGGER}).catch(() => {});
}

export function openPlaygroundRoute({router, isBlocked} = {}) {
  if (resolveBlocked(isBlocked)) return;
  closeNavigationDrawer();
  router?.push({name: ROUTE_NAMES.PLAYGROUND}).catch(() => {});
}

export function openGuideRoute({router, isBlocked} = {}) {
  if (resolveBlocked(isBlocked)) return;
  closeNavigationDrawer();
  router?.push({name: ROUTE_NAMES.GUIDE}).catch(() => {});
}

export function openTermsRoute({router, isBlocked} = {}) {
  if (resolveBlocked(isBlocked)) return;
  closeNavigationDrawer();
  router?.push({name: ROUTE_NAMES.TERMS}).catch(() => {});
}

export async function logoutApp({
  router,
  isBlocked,
  logScope = "appShellActions",
} = {}) {
  if (resolveBlocked(isBlocked)) return;
  try {
    await authApiLive.logout();
  } catch (error) {
    logWarn(`[${logScope}] logout 오류:`, error);
  } finally {
    resetAppBootstrapState();
    useAuthStore().resetAuth?.();
    closeNavigationDrawer();
    await router
      ?.replace({
        name: ROUTE_NAMES.LOGIN_REQUIRED,
        query: {reason: "LOGIN_REQUIRED"},
      })
      .catch(() => {});
  }
}
