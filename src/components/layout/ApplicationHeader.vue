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

import {computed, inject} from "vue";
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
import {useViewportStore} from "@/stores/viewportStore";
import {
  openLanguageOverlay,
  openNoticeOverlay,
  openPersonalizationOverlay,
  openPrivacyOverlay,
  openSystemOverlay,
} from "@/composables/overlay/responseOverlayActions";
import {useAppContext} from "@/composables/app/useAppContext";
import {useAppShellThemeState} from "@/composables/app/useAppShellThemeState";
import {useRuntimeModeFlags} from "@/composables/app/useRuntimeModeFlags";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";
import {
  logoutApp,
  openGuideRoute,
  openPlaygroundRoute,
  openSwaggerRoute,
  openTermsRoute,
  toggleThemeAction,
} from "@/composables/app/appShellActions";
import {
  CHAT_WORKSPACE_STATE_KEY,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatActionContext";

const {t} = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const navigationStore = useNavigationStore();
const viewportStore = useViewportStore();
const chatStreamStore = useChatStreamStore();
const {isGlobalLocked, isStreamingLocked, isChatHistoryLocked} =
  useNavigationLock();
const {theme} = useAppContext();
const {themeName: shellThemeName} = useAppShellThemeState(theme?.current);
const {shouldUseMobileLayout} = useRuntimeModeFlags();
const isAppShellActionBlocked = computed(
  () =>
    isGlobalLocked.value ||
    isStreamingLocked.value ||
    isChatHistoryLocked.value ||
    chatStreamStore.isStreaming
);
const isShellActionBlocked = () => isAppShellActionBlocked.value;
const overlayActionOptions = {
  isBlocked: isShellActionBlocked,
  viewportStore,
  navigationStore,
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
const shellActions = {
  toggleTheme: () =>
    toggleThemeAction({
      theme,
      themeName: shellThemeName,
      isMobile: shouldUseMobileLayout,
      isBlocked: isShellActionBlocked,
      logScope: "ApplicationHeader",
    }),
  openSwagger: () =>
    openSwaggerRoute({router, isBlocked: isShellActionBlocked}),
  openPlayground: () =>
    openPlaygroundRoute({
      router,
      navigationStore,
      isBlocked: isShellActionBlocked,
    }),
  openGuide: () =>
    openGuideRoute({router, navigationStore, isBlocked: isShellActionBlocked}),
  openTerms: () =>
    openTermsRoute({router, navigationStore, isBlocked: isShellActionBlocked}),
  logout: () =>
    logoutApp({
      router,
      navigationStore,
      authStore,
      isBlocked: isShellActionBlocked,
      logScope: "ApplicationHeader",
    }),
};
</script>
