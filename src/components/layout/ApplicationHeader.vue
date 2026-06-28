<template>
  <header
    class="application-header tw-relative tw-z-popover tw-flex tw-h-[56px] tw-min-h-0 tw-w-full tw-min-w-0 tw-items-center tw-justify-between tw-gap-4 tw-overflow-visible tw-border-b tw-border-solid tw-border-app-sidebarBorder tw-bg-app-chat tw-pl-5 tw-pr-[18px] tw-text-app-text"
    :aria-label="t('application.headerLabel')"
  >
    <div
      class="application-header__brand tw-flex tw-min-w-0 tw-items-baseline tw-gap-2.5 tw-overflow-hidden"
    >
      <strong
        class="application-header__title tw-shrink-0 tw-whitespace-nowrap tw-text-lg tw-font-black tw-tracking-[-0.04em]"
        >{{ t("application.title") }}</strong
      >
      <span
        class="application-header__subtitle tw-min-w-0 tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-text-sm tw-font-bold tw-text-app-subtle"
        >{{ t("application.subtitle") }}</span
      >
    </div>

    <nav
      class="application-header__actions tw-relative tw-z-popover tw-ml-auto tw-inline-flex tw-min-w-max tw-shrink-0 tw-items-center tw-justify-end tw-gap-2"
      :aria-label="t('application.userMenuLabel')"
    >
      <button
        v-if="systemSettings.showGuideButton"
        class="round-icon guide-link guide-link--icon tw-inline-flex tw-h-10 tw-w-10 tw-min-w-10 tw-shrink-0 tw-items-center tw-justify-center"
        type="button"
        :aria-label="t('common.guide')"
        :title="t('common.guide')"
        @click="shellActions.openGuide()"
      >
        <GuideIcon />
      </button>
      <button
        v-if="systemSettings.showThemeButton"
        class="round-icon theme-toggle tw-inline-flex tw-h-10 tw-w-10 tw-min-w-10 tw-shrink-0 tw-items-center tw-justify-center"
        type="button"
        :aria-label="t('common.theme')"
        :title="t('common.theme')"
        @click="shellActions.toggleTheme()"
      >
        <span
          class="theme-glyph"
          :class="{'theme-glyph--dark': themeName === 'dark'}"
        ></span>
      </button>
      <button
        v-if="systemSettings.showSwaggerButton"
        class="round-icon document-toggle tw-inline-flex tw-h-10 tw-w-10 tw-min-w-10 tw-shrink-0 tw-items-center tw-justify-center"
        type="button"
        :aria-label="t('common.swagger')"
        :title="t('common.swagger')"
        @click="shellActions.openSwagger()"
      >
        <SwaggerDocIcon />
      </button>
      <UserMenu
        @notice="responseOverlay.openNotice()"
        @privacy="responseOverlay.openPrivacy()"
        @terms="shellActions.openTerms()"
        @personalization="responseOverlay.openPersonalization()"
        @system="responseOverlay.openSystem()"
        @language="responseOverlay.openLanguage()"
        @playground="shellActions.openPlayground()"
        @logout="shellActions.logout()"
      />
    </nav>
  </header>
</template>

<script setup>
/**
 * PC 전용 application header입니다.
 * 기존 ChatHeader의 데스크톱 우측 액션을 이 컴포넌트로 이동하여,
 * ChatHeader는 대화방/워크스페이스 헤더 역할만 유지합니다.
 */

import {computed, inject, nextTick} from "vue";
import {useRouter} from "vue-router";
import {storeToRefs} from "pinia";
import {useI18n} from "vue-i18n";
import UserMenu from "@/components/menu/UserMenu.vue";
import SwaggerDocIcon from "@/components/icons/SwaggerDocIcon.vue";
import GuideIcon from "@/components/icons/GuideIcon.vue";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useAuthStore} from "@/stores/authStore";
import {useNavigationStore} from "@/stores/navigationStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {
  openLanguageOverlay,
  openNoticeOverlay,
  openPersonalizationOverlay,
  openPrivacyOverlay,
  openSystemOverlay,
} from "@/composables/overlay/responseOverlayActions";
import {useAppContext} from "@/composables/app/useAppContext";
import {resetAppBootstrapState} from "@/composables/app/appBootstrapState";
import {useAppShellStore} from "@/stores/appShellStore";
import {useRuntimeModeFlags} from "@/composables/app/useRuntimeModeFlags";
import {authApiLive} from "@/api/live/authApi.live";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {resolveBlocked} from "@/utils/interactionGuard";
import {
  CHAT_WORKSPACE_STATE_KEY,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatStateContext";

const {t} = useI18n();
const router = useRouter();
const chatStreamStore = useChatStreamStore();
const authStore = useAuthStore();
const navigationStore = useNavigationStore();
const {theme} = useAppContext();
const appShellStore = useAppShellStore();
appShellStore.setThemeName(theme?.current);
const shellThemeName = computed({
  get: () => appShellStore.themeName,
  set: (value) => appShellStore.setThemeName(value),
});
const {shouldUseMobileLayout} = useRuntimeModeFlags();
const isAppShellActionBlocked = computed(() => chatStreamStore.isWait);
const isShellActionBlocked = () => isAppShellActionBlocked.value;
const overlayActionOptions = {
  isBlocked: isShellActionBlocked,
};
const responseOverlay = {
  openNotice: () => openNoticeOverlay(overlayActionOptions),
  openPrivacy: () => openPrivacyOverlay(overlayActionOptions),
  openPersonalization: () => openPersonalizationOverlay(overlayActionOptions),
  openSystem: () => openSystemOverlay(overlayActionOptions),
  openLanguage: () => openLanguageOverlay(overlayActionOptions),
};
const workspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const systemSettingsStore = useSystemSettingsStore();
const {settings: systemSettings} = storeToRefs(systemSettingsStore);
const themeName = computed(
  () => workspaceState.value.themeName || shellThemeName.value || "light"
);
async function toggleTheme() {
  if (resolveBlocked(isShellActionBlocked)) return;

  try {
    if (!theme?.toggle) return;

    theme.toggle();
    shellThemeName.value = theme.current;
    await nextTick();

    if (
      isMermaidRenderingEnabledForPlatform(
        getRuntimeSystemSettings(),
        Boolean(shouldUseMobileLayout.value)
      )
    ) {
      await renderMermaidInElement(document.querySelector(".message-list"), {
        force: true,
      });
    }
  } catch (error) {
    logWarn("[ApplicationHeader] toggleTheme 오류:", error);
  }
}

function openRoute(name, {closeDrawer = false} = {}) {
  if (resolveBlocked(isShellActionBlocked)) return;
  if (closeDrawer) navigationStore.setDrawerOpen(false);
  router.push({name}).catch(() => {});
}

async function logout() {
  if (resolveBlocked(isShellActionBlocked)) return;

  try {
    await authApiLive.logout();
  } catch (error) {
    logWarn("[ApplicationHeader] logout 오류:", error);
  } finally {
    resetAppBootstrapState();
    authStore.resetAuth?.();
    navigationStore.setDrawerOpen(false);
    await router
      .replace({
        name: ROUTE_NAMES.LOGIN_REQUIRED,
        query: {reason: "LOGIN_REQUIRED"},
      })
      .catch(() => {});
  }
}

const shellActions = {
  toggleTheme,
  openSwagger: () => openRoute(ROUTE_NAMES.SWAGGER),
  openPlayground: () => openRoute(ROUTE_NAMES.PLAYGROUND, {closeDrawer: true}),
  openGuide: () => openRoute(ROUTE_NAMES.GUIDE),
  openTerms: () => openRoute(ROUTE_NAMES.TERMS, {closeDrawer: true}),
  logout,
};
</script>
