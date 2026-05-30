<template>
  <div ref="menuRef" class="user-menu" :class="{'user-menu--open': open}">
    <button
      class="user-menu-trigger"
      type="button"
      :aria-label="t('common.user')"
      @click="toggleOpen"
    >
      <span class="app-avatar app-avatar--header">{{ userInitial }}</span>
      <span class="user-menu-name">{{ displayName }}</span>
      <ChevronDownIcon class="user-menu-chevron-icon" />
    </button>

    <transition name="menu-pop">
      <section v-if="open" class="user-menu-panel" role="menu">
        <button
          v-if="systemSettings.showNoticeMenu"
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('notice')"
        >
          <strong>{{ t("common.notice") }}</strong>
          <small>{{ t("menu.noticeSummary") }}</small>
        </button>
        <button
          v-if="systemSettings.showPrivacyMenu"
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('privacy')"
        >
          <strong>{{ t("common.privacy") }}</strong>
          <small>{{ t("menu.privacySummary") }}</small>
        </button>
        <button
          v-if="systemSettings.showTermsMenu"
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('terms')"
        >
          <strong>{{ t("common.terms") }}</strong>
          <small>{{ t("menu.termsSummary") }}</small>
        </button>
        <button
          v-if="systemSettings.showPersonalizationMenu"
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('personalization')"
        >
          <strong>{{ t("common.personalization") }}</strong>
          <small>{{ t("menu.personalizationSummary") }}</small>
        </button>
        <button
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('system')"
        >
          <strong>{{ t("common.system") }}</strong>
          <small>{{ t("menu.systemSummary") }}</small>
        </button>
        <button
          v-if="systemSettings.showPlaygroundMenu"
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('playground')"
        >
          <strong>{{ t("common.playground") }}</strong>
          <small>{{ t("menu.playgroundSummary") }}</small>
        </button>
        <button
          v-if="systemSettings.showLogoutButton"
          class="user-menu-item user-menu-item--danger"
          type="button"
          role="menuitem"
          @click="select('logout')"
        >
          <strong>{{ t("common.logout") }}</strong>
          <small>{{ t("menu.logoutSummary") }}</small>
        </button>

        <div
          class="user-menu-language"
          role="group"
          :aria-label="t('common.language')"
        >
          <button
            class="user-menu-item user-menu-item--language"
            type="button"
            :aria-expanded="languageOpen"
            @click="toggleLanguageOpen"
          >
            <span>
              <strong>{{ t("common.language") }}</strong>
              <small>{{ t("menu.languageSummary") }}</small>
            </span>
            <ChevronDownIcon />
          </button>

          <transition name="menu-pop">
            <div v-if="languageOpen" class="user-menu-language-options">
              <button
                v-for="option in languageOptions"
                :key="option.value"
                class="user-menu-language-option"
                :class="{active: currentLocale === option.value}"
                type="button"
                @click="selectLocale(option.value)"
              >
                <span>{{ option.label }}</span>
                <CheckIcon v-if="currentLocale === option.value" />
              </button>
            </div>
          </transition>
        </div>
      </section>
    </transition>
  </div>
</template>

<script setup>
/**
 * @file components/menu/UserMenu.vue
 * @description 언어/사용자 메뉴 등 전역 메뉴 UI입니다. 선택 이벤트를 store 또는 상위 action에 전달합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import {setAppLocale} from "@/i18n";
import {useOutsideClick} from "@/composables/events/useOutsideClick";
import {useAuthStore} from "@/stores/authStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";

const emit = defineEmits([
  "notice",
  "privacy",
  "terms",
  "personalization",
  "system",
  "playground",
  "logout",
]);
const {t, locale} = useI18n();
const authStore = useAuthStore();
const systemSettingsStore = useSystemSettingsStore();
const {userName} = storeToRefs(authStore);
const {settings: systemSettings} = storeToRefs(systemSettingsStore);

const open = ref(false);
const languageOpen = ref(false);
const menuRef = ref(null);
const currentLocale = computed(() => locale.value);
const languageOptions = computed(() => [
  {value: "ko", label: t("common.korean")},
  {value: "en", label: t("common.english")},
]);

const displayName = computed(() => userName.value || t("common.user"));
const userInitial = computed(() => {
  const name = displayName.value;
  return name ? name.charAt(0).toUpperCase() : "U";
});

/**
 * 관련 modal, sheet, menu, overlay 상태를 닫힘 상태로 전환합니다.
 */
function closeMenu() {
  open.value = false;
  languageOpen.value = false;
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function toggleOpen() {
  open.value = !open.value;
  if (!open.value) languageOpen.value = false;
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function toggleLanguageOpen() {
  languageOpen.value = !languageOpen.value;
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function select(action) {
  closeMenu();
  emit(action);
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function selectLocale(value) {
  setAppLocale(value);
  closeMenu();
}

useOutsideClick(() => menuRef.value, closeMenu);
</script>
