<template>
  <div class="sidebar-user sidebar-user--mobile">
    <button
      class="sidebar-user-profile"
      type="button"
      :aria-label="t('common.settings')"
      @click="responseOverlay.openSettings()"
    >
      <div class="user-avatar">{{ userInitial }}</div>
      <div class="sidebar-user-main">
        <strong>{{ displayName }}</strong
        ><small>{{ t("common.plus") }}</small>
      </div>
    </button>
    <div class="sidebar-user-actions">
      <button
        class="sidebar-user-action sidebar-user-action--logout"
        type="button"
        :aria-label="t('common.logout')"
        :title="t('common.logout')"
        @click="actions.logout()"
      >
        <span class="logout-glyph" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * @file components/navigation/controls/SidebarUserFooter.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 */

import {computed, nextTick} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useAuthStore} from "@/stores/authStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {openSettingsOverlay} from "@/composables/overlay/responseOverlayActions";
import {useAppContext} from "@/composables/app/useAppContext";
import {resetAppBootstrapState} from "@/composables/app/appBootstrapState";
import {useAppShellStore} from "@/stores/appShellStore";
import {useRuntimeModeFlags} from "@/composables/app/useRuntimeModeFlags";
import {authApiLive} from "@/api/live/authApi.live";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {resolveBlocked} from "@/utils/interactionGuard";

const {t} = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const chatStreamStore = useChatStreamStore();
const {userName} = storeToRefs(authStore);

const {theme} = useAppContext();
const appShellStore = useAppShellStore();
appShellStore.setThemeName(theme?.current);
const themeName = computed({
  get: () => appShellStore.themeName,
  set: (value) => appShellStore.setThemeName(value),
});
const {shouldUseMobileLayout} = useRuntimeModeFlags();
const isAppShellActionBlocked = computed(() => chatStreamStore.isWait);
const isShellActionBlocked = () => isAppShellActionBlocked.value;
const responseOverlay = {
  openSettings: () =>
    openSettingsOverlay({
      isMobile: shouldUseMobileLayout,
      isBlocked: isShellActionBlocked,
    }),
};

async function toggleTheme() {
  if (resolveBlocked(isShellActionBlocked)) return;

  try {
    if (!theme?.toggle) return;

    theme.toggle();
    themeName.value = theme.current;
    await nextTick();

    if (
      isMermaidRenderingEnabledForPlatform()
    ) {
      await renderMermaidInElement(document.querySelector(".message-list"), {
        force: true,
      });
    }
  } catch (error) {
    logWarn("[SidebarUserFooter] toggleTheme 오류:", error);
  }
}

function openRoute(name, {closeDrawer = false} = {}) {
  if (resolveBlocked(isShellActionBlocked)) return;
  if (closeDrawer) appShellStore.setDrawerOpen(false);
  router.push({name}).catch(() => {});
}

async function logout() {
  if (resolveBlocked(isShellActionBlocked)) return;

  try {
    await authApiLive.logout();
  } catch (error) {
    logWarn("[SidebarUserFooter] logout 오류:", error);
  } finally {
    resetAppBootstrapState();
    authStore.resetAuth?.();
    appShellStore.setDrawerOpen(false);
    await router
      .replace({
        name: ROUTE_NAMES.LOGIN_REQUIRED,
        query: {reason: "LOGIN_REQUIRED"},
      })
      .catch(() => {});
  }
}

const actions = {
  toggleTheme,
  openPlayground: () => openRoute(ROUTE_NAMES.PLAYGROUND, {closeDrawer: true}),
  openSwagger: () => openRoute(ROUTE_NAMES.SWAGGER),
  logout,
};

const displayName = computed(() => userName.value || t("common.user"));
const userInitial = computed(() => {
  const name = displayName.value;
  return name ? name.charAt(0) : "U";
});
</script>

<style scoped lang="scss">
/* Scoped layout guard: keep component roots and flex/grid children shrink-safe. */
.sidebar-user--mobile,
.sidebar-user-profile,
.sidebar-user-main,
.sidebar-user-actions {
  min-width: 0;
  box-sizing: border-box;
}

.sidebar-user--mobile {
  min-height: 0;
}
</style>
