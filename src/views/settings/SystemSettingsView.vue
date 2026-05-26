<template>
  <form class="system-settings-view" @submit.prevent="apply">
    <div class="system-settings-scroll">
      <section class="system-settings-hero">
        <p class="system-settings-eyebrow">{{ t("systemSettings.eyebrow") }}</p>
        <h3>{{ t("systemSettings.title") }}</h3>
        <p>{{ t("systemSettings.description") }}</p>
      </section>

      <section
        v-for="group in groups"
        :key="group.title"
        class="system-settings-group"
      >
        <header>
          <span>{{ group.kicker }}</span>
          <h4>{{ group.title }}</h4>
        </header>

        <label
          v-for="item in group.items"
          :key="item.key"
          class="system-settings-row"
          :for="`system-setting-${item.key}`"
        >
          <span class="system-settings-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>

          <input
            v-if="item.type === 'number'"
            :id="`system-setting-${item.key}`"
            v-model.number="draft[item.key]"
            class="system-settings-number"
            type="number"
            :min="item.min || 0"
            :max="item.max || 9999"
            :step="item.step || 1"
          />
          <input
            v-else-if="item.type === 'text'"
            :id="`system-setting-${item.key}`"
            v-model="draft[item.key]"
            class="system-settings-text"
            type="text"
          />
          <select
            v-else-if="item.type === 'select'"
            :id="`system-setting-${item.key}`"
            v-model="draft[item.key]"
            class="system-settings-select"
          >
            <option
              v-for="option in item.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <span v-else class="system-settings-switch">
            <input
              :id="`system-setting-${item.key}`"
              v-model="draft[item.key]"
              type="checkbox"
            />
            <span aria-hidden="true"></span>
          </span>
        </label>
      </section>
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

import {computed, reactive, watch} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {usePlatformStore} from "@/stores/platformStore";
import {syncViewportSettings} from "@/utils/viewportSettingsSync";
import {
  DEFAULT_SYSTEM_SETTINGS,
  KEYBOARD_MODE_OPTIONS,
  MAX_MOBILE_BREAKPOINT_PX,
  MIN_MOBILE_BREAKPOINT_PX,
  PLATFORM_OVERRIDE_OPTIONS,
  AUTH_MODE_OPTIONS,
} from "@/constants/systemSettings";

const emit = defineEmits(["close", "applied"]);
const {t} = useI18n();
const systemSettingsStore = useSystemSettingsStore();
const platformStore = usePlatformStore();
const {settings} = storeToRefs(systemSettingsStore);

const draft = reactive({...DEFAULT_SYSTEM_SETTINGS});

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

const groups = computed(() => [
  {
    kicker: t("common.api"),
    title: t("systemSettings.groups.api"),
    items: [
      settingItem("useRealApi"),
      settingItem("platformOverride", {
        type: "select",
        label: t("systemSettings.items.platformOverride.labelWithActual", {
          actual: actualPlatformLabel.value,
        }),
        options: PLATFORM_OVERRIDE_OPTIONS,
      }),
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
    kicker: "MOBILE",
    title: t("systemSettings.groups.mobile"),
    items: [
      settingItem("mobileBreakpoint", {
        type: "number",
        min: MIN_MOBILE_BREAKPOINT_PX,
        max: MAX_MOBILE_BREAKPOINT_PX,
        step: 1,
      }),
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
      settingItem("showMobileApiProgress"),
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

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function syncDraft() {
  Object.assign(draft, settings.value);
}

/**
 * 계산된 설정 또는 사용자 선택 값을 실제 상태/DOM에 적용합니다.
 */
function apply() {
  systemSettingsStore.applySettings(draft);
  platformStore.refresh();
  syncViewportSettings(systemSettingsStore.mobileBreakpoint);
  emit("applied");
  emit("close");
}

watch(settings, syncDraft, {immediate: true, deep: true});
</script>
