<template>
  <form class="system-settings-view" @submit.prevent="apply">
    <div ref="settingsScrollRef" class="system-settings-scroll">
      <SystemSettingsTabs
        :tabs="settingTabs"
        :active-tab="activeSettingTab"
        @change="activeSettingTab = $event"
      />

      <SystemSettingsGroup
        v-for="group in activeGroups"
        :key="group.title"
        :group="group"
        :draft="draft"
        @update-setting="updateDraftSetting"
      />
    </div>

    <footer class="system-settings-footer">
      <button
        class="playground-button playground-button--secondary"
        type="button"
        @click="$emit('close')"
      >
        {{ t("systemSettings.close") }}
      </button>
      <button
        class="playground-button playground-button--primary system-settings-apply-button"
        type="submit"
      >
        {{ t("systemSettings.apply") }}
      </button>
    </footer>
  </form>
</template>

<script setup>
/**
 * @file views/settings/SystemSettingsView.vue
 * @description 라우터가 직접 렌더하는 페이지 진입 컴포넌트입니다. 대부분 실제 로직은 container에 위임합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, reactive, ref, watch} from "vue";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {storeToRefs} from "pinia";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {usePlatformStore} from "@/stores/platformStore";
import {useAuthStore} from "@/stores/authStore";
import {resetAppBootstrapState} from "@/composables/app/appBootstrapState";
import {useChatStore} from "@/stores/chatStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {authApiLive} from "@/api/live/authApi.live";
import {logWarn} from "@/utils/logger";
import {useNavigationLockStore} from "@/stores/navigationLockStore";
import {syncViewportSettings} from "@/utils/applyViewportBreakpoint";
import {
  DEFAULT_MOBILE_BREAKPOINT_PX,
  DEFAULT_SYSTEM_SETTINGS,
  FORCED_MOBILE_PLATFORM_BREAKPOINT_PX,
  KEYBOARD_MODE_OPTIONS,
  MAX_MOBILE_HISTORY_LAZY_APPEND_COUNT,
  MAX_MOBILE_HISTORY_LAZY_INITIAL_COUNT,
  MAX_PC_HISTORY_LAZY_APPEND_COUNT,
  MAX_PC_HISTORY_LAZY_INITIAL_COUNT,
  MAX_PC_HISTORY_LAZY_TOP_THRESHOLD_PX,
  MAX_MOBILE_BREAKPOINT_PX,
  MIN_MOBILE_HISTORY_LAZY_APPEND_COUNT,
  MIN_MOBILE_HISTORY_LAZY_INITIAL_COUNT,
  MIN_PC_HISTORY_LAZY_APPEND_COUNT,
  MIN_PC_HISTORY_LAZY_INITIAL_COUNT,
  MIN_PC_HISTORY_LAZY_TOP_THRESHOLD_PX,
  MIN_MOBILE_BREAKPOINT_PX,
  PLATFORM_OVERRIDE_OPTIONS,
  PLATFORM_OVERRIDE_MODES,
  AUTH_MODE_OPTIONS,
} from "@/constants/systemSettings";
import {ROUTE_NAMES} from "@/constants/routeNames";
import SystemSettingsGroup from "@/components/settings/SystemSettingsGroup.vue";
import SystemSettingsTabs from "@/components/settings/SystemSettingsTabs.vue";

const emit = defineEmits(["close", "applied"]);
const {t} = useI18n();
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();
const router = useRouter();
const systemSettingsStore = useSystemSettingsStore();
const platformStore = usePlatformStore();
const authStore = useAuthStore();
const navigationLockStore = useNavigationLockStore();
const {settings} = storeToRefs(systemSettingsStore);

const draft = reactive({...DEFAULT_SYSTEM_SETTINGS});
const applying = ref(false);
const settingsScrollRef = ref(null);
const activeSettingTab = ref("common");

const settingText = (key, field) => t(`systemSettings.items.${key}.${field}`);

const actualPlatformLabel = computed(() => {
  const info = platformStore.info || {};
  return (
    info.actualPlatformLabel ||
    [info.actualEnv, info.actualDevice, info.actualBrowser]
      .filter(Boolean)
      .join(" / ") ||
    "-"
  );
});

/**
 * store, DOM CSS 변수 또는 reactive 상태에 값을 반영합니다.
 */
function settingItem(key, extra = {}) {
  return {
    key,
    type: "switch",
    label: settingText(key, "label"),
    description: settingText(key, "description"),
    ...extra,
  };
}

useOverlayScrollbar(settingsScrollRef, {overflow: {x: "hidden", y: "scroll"}}, {
  enabled: () => shouldUseOverlayScrollbar.value,
});

const commonGroups = computed(() => [
  {
    kicker: "PLATFORM",
    title: t("systemSettings.groups.platformResponsive"),
    items: [
      settingItem("platformOverride", {
        type: "select",
        label: t("systemSettings.items.platformOverride.labelWithActual", {
          actual: actualPlatformLabel.value,
        }),
        options: PLATFORM_OVERRIDE_OPTIONS,
      }),
      settingItem("mobileBreakpoint", {
        type: "number",
        min: MIN_MOBILE_BREAKPOINT_PX,
        max: MAX_MOBILE_BREAKPOINT_PX,
        step: 1,
      }),
    ],
  },
  {
    kicker: t("common.api"),
    title: t("systemSettings.groups.api"),
    items: [
      settingItem("useRealApi"),
      settingItem("showPcProgress"),
      settingItem("showMobileProgress"),
    ],
  },
  {
    kicker: "AUTH",
    title: t("systemSettings.groups.auth"),
    items: [
      settingItem("webAuthMode", {
        type: "select",
        options: AUTH_MODE_OPTIONS.map((value) => ({value, label: value})),
      }),
      settingItem("mobileAuthMode", {
        type: "select",
        options: AUTH_MODE_OPTIONS.map((value) => ({value, label: value})),
      }),
      settingItem("webLoginUrl", {type: "text"}),
      settingItem("mobileLoginUrl", {type: "text"}),
      settingItem("tempLoginUrl", {type: "text"}),
      settingItem("accessInfoUrl", {type: "text"}),
      settingItem("logoutUrl", {type: "text"}),
      settingItem("jwtRefreshUrl", {type: "text"}),
      settingItem("jwtWithCredentials"),
    ],
  },
  {
    kicker: "CHAT",
    title: t("systemSettings.groups.chat"),
    items: [settingItem("autoScrollOnAnswer")],
  },
  {
    kicker: "ACTION",
    title: t("systemSettings.groups.action"),
    items: [
      settingItem("showGuideButton"),
      settingItem("showThemeButton"),
      settingItem("showSwaggerButton"),
    ],
  },
  {
    kicker: "MENU",
    title: t("systemSettings.groups.menu"),
    items: [
      settingItem("showNoticeMenu"),
      settingItem("showPrivacyMenu"),
      settingItem("showTermsMenu"),
      settingItem("showPersonalizationMenu"),
      settingItem("showPlaygroundMenu"),
      settingItem("showLogoutButton"),
    ],
  },
]);

const pcGroups = computed(() => [
  {
    kicker: "PC",
    title: t("systemSettings.groups.chat"),
    items: [
      settingItem("pcEnableMermaidRendering"),
      settingItem("pcShowMermaidHeader", {
        disabled: !draft.pcEnableMermaidRendering,
      }),
      settingItem("pcHistoryLazyInitialCount", {
        type: "number",
        min: MIN_PC_HISTORY_LAZY_INITIAL_COUNT,
        max: MAX_PC_HISTORY_LAZY_INITIAL_COUNT,
        step: 1,
      }),
      settingItem("pcHistoryLazyAppendCount", {
        type: "number",
        min: MIN_PC_HISTORY_LAZY_APPEND_COUNT,
        max: MAX_PC_HISTORY_LAZY_APPEND_COUNT,
        step: 1,
      }),
      settingItem("pcHistoryLazyTopThresholdPx", {
        type: "number",
        min: MIN_PC_HISTORY_LAZY_TOP_THRESHOLD_PX,
        max: MAX_PC_HISTORY_LAZY_TOP_THRESHOLD_PX,
        step: 1,
      }),
    ],
  },
]);

const mobileGroups = computed(() => [
  {
    kicker: "MOBILE",
    title: t("systemSettings.groups.mobile"),
    items: [
      settingItem("keyboardMode", {
        type: "select",
        options: KEYBOARD_MODE_OPTIONS,
      }),
      settingItem("useVirtualKeyboard"),
      settingItem("showVirtualKeyboardDebug"),
      settingItem("virtualKeyboardHeight", {
        type: "number",
        min: 180,
        max: 600,
        step: 1,
      }),
      settingItem("useMicrophone"),
      settingItem("abortChatOnMobileBackground"),
    ],
  },
  {
    kicker: "BOTTOM SHEET",
    title: t("systemSettings.groups.bottomSheet"),
    items: [
      settingItem("bottomSheetMinHeight", {
        type: "number",
        min: 180,
        max: 720,
        step: 1,
      }),
      settingItem("bottomSheetMaxHeight", {
        type: "number",
        min: 320,
        max: 960,
        step: 1,
      }),
    ],
  },
  {
    kicker: "CHAT",
    title: t("systemSettings.groups.chat"),
    items: [
      settingItem("mobileEnableMermaidRendering"),
      settingItem("mobileShowMermaidHeader", {
        disabled: !draft.mobileEnableMermaidRendering,
      }),
      settingItem("mobileHistoryLazyInitialCount", {
        type: "number",
        min: MIN_MOBILE_HISTORY_LAZY_INITIAL_COUNT,
        max: MAX_MOBILE_HISTORY_LAZY_INITIAL_COUNT,
        step: 1,
      }),
      settingItem("mobileHistoryLazyAppendCount", {
        type: "number",
        min: MIN_MOBILE_HISTORY_LAZY_APPEND_COUNT,
        max: MAX_MOBILE_HISTORY_LAZY_APPEND_COUNT,
        step: 1,
      }),
    ],
  },
]);

const settingTabs = computed(() => [
  {key: "common", label: t("systemSettings.tabs.common")},
  {key: "pc", label: t("systemSettings.tabs.pc")},
  {key: "mobile", label: t("systemSettings.tabs.mobile")},
]);

const activeGroups = computed(() => {
  if (activeSettingTab.value === "pc") return pcGroups.value;
  if (activeSettingTab.value === "mobile") return mobileGroups.value;
  return commonGroups.value;
});

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function syncDraft() {
  Object.assign(draft, settings.value);
}

function updateDraftSetting(key, value) {
  draft[key] = value;
}

/**
 * 인증 방식이 변경되면 기존 JWT 토큰 또는 세션 쿠키가 새 인증 정책과 섞이지 않도록
 * 설정 적용 전에 사용자에게 알리고 현재 인증 정책 기준으로 로그아웃을 먼저 수행합니다.
 */
function hasAuthModeChanged() {
  return (
    draft.webAuthMode !== settings.value.webAuthMode ||
    draft.mobileAuthMode !== settings.value.mobileAuthMode
  );
}

function hasLogoutRequiredSettingChanged() {
  return hasAuthModeChanged();
}

/**
 * 브라우저 기본 confirm을 사용해 기존 디자인/CSS를 건드리지 않고 로그아웃 안내만 제공합니다.
 */

function isAutoPlatformOverride(value) {
  return value === PLATFORM_OVERRIDE_MODES.auto;
}

function resolveBreakpointForPlatformOverride(value) {
  return isAutoPlatformOverride(value)
    ? DEFAULT_MOBILE_BREAKPOINT_PX
    : FORCED_MOBILE_PLATFORM_BREAKPOINT_PX;
}

function confirmLogoutRequiredSettingChange() {
  if (typeof window === "undefined" || typeof window.confirm !== "function") {
    return true;
  }

  return window.confirm(t("systemSettings.logoutRequiredSettingChangeConfirm"));
}

/**
 * 인증 모드 전환 시 기존 인증 컨텍스트를 정리합니다.
 * 서버 로그아웃이 실패해도 클라이언트 인증 상태는 반드시 초기화합니다.
 */
async function forceLogoutForPolicyChange() {
  try {
    await authApiLive.logout();
  } catch (error) {
    logWarn("[SystemSettingsView] policy setting change logout 오류:", error);
  } finally {
    const chatStore = useChatStore();
    const chatStreamStore = useChatStreamStore();

    // 인증/URL 정책 변경은 현재 대화 컨텍스트를 폐기하는 전역 정책 변경입니다.
    // 대화방 렌더링 락이나 스트리밍 허용권이 남아 있으면 login-required 이동이
    // 차단될 수 있으므로 로그아웃 처리 전에 채팅 이동 잠금을 명시적으로 정리합니다.
    navigationLockStore.releaseAll();
    chatStore.clearActiveSession();
    chatStreamStore.finish();
    resetAppBootstrapState();
    authStore.resetAuth();
  }
}

/**
 * 계산된 설정 또는 사용자 선택 값을 실제 상태/DOM에 적용합니다.
 */
async function apply() {
  if (applying.value) return;

  const logoutRequiredSettingChanged = hasLogoutRequiredSettingChanged();

  if (logoutRequiredSettingChanged && !confirmLogoutRequiredSettingChange()) {
    return;
  }

  applying.value = true;

  try {
    if (logoutRequiredSettingChanged) {
      await forceLogoutForPolicyChange();
    }

    systemSettingsStore.applySettings(draft);
    platformStore.refresh();
    syncViewportSettings(systemSettingsStore.mobileBreakpoint);
    emit("applied");
    emit("close");

    if (logoutRequiredSettingChanged) {
      await router
        .replace({
          name: ROUTE_NAMES.LOGIN_REQUIRED,
          query: {reason: "LOGIN_REQUIRED"},
        })
        .catch(() => {});
    }
  } finally {
    applying.value = false;
  }
}

watch(settings, syncDraft, {immediate: true, deep: true});

watch(
  () => draft.platformOverride,
  (nextPlatformOverride, previousPlatformOverride) => {
    if (nextPlatformOverride === previousPlatformOverride) return;
    draft.mobileBreakpoint =
      resolveBreakpointForPlatformOverride(nextPlatformOverride);
  }
);
</script>
