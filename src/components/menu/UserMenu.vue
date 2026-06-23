<template>
  <div
    ref="menuRef"
    class="user-menu tw-relative tw-inline-flex tw-items-center"
    :class="{'user-menu--open': open}"
  >
    <button
      class="user-menu-trigger tw-inline-flex tw-h-10 tw-max-w-[220px] tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-app-controlBorder tw-bg-app-control tw-px-2.5 tw-text-app-text tw-shadow-control"
      type="button"
      :aria-label="t('common.user')"
      @click="toggleOpen"
    >
      <span
        class="user-avatar user-avatar--header tw-inline-flex tw-h-7 tw-w-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-app-primary tw-text-sm tw-font-extrabold tw-text-white"
        >{{ userInitial }}</span
      >
      <span
        class="user-menu-name tw-min-w-0 tw-max-w-[120px] tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-text-sm tw-font-bold"
        >{{ displayName }}</span
      >
      <ChevronDownIcon
        class="user-menu-chevron-icon tw-h-4 tw-w-4 tw-shrink-0 tw-text-app-subtle tw-transition-transform tw-duration-200"
      />
    </button>

    <transition name="menu-pop">
      <section
        v-if="open"
        class="user-menu-panel tw-absolute tw-right-0 tw-top-[calc(100%+8px)] tw-z-popover tw-grid tw-min-w-[260px] tw-gap-1 tw-rounded-2xl tw-border tw-border-app-border tw-bg-app-surface tw-p-2 tw-text-app-text tw-shadow-menu"
        role="menu"
      >
        <button
          v-if="systemSettings.showNoticeMenu"
          class="user-menu-item tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
          type="button"
          role="menuitem"
          @click="select('notice')"
        >
          <strong>{{ t("common.notice") }}</strong>
          <small>{{ t("menu.noticeSummary") }}</small>
        </button>
        <button
          v-if="systemSettings.showPrivacyMenu"
          class="user-menu-item tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
          type="button"
          role="menuitem"
          @click="select('privacy')"
        >
          <strong>{{ t("common.privacy") }}</strong>
          <small>{{ t("menu.privacySummary") }}</small>
        </button>
        <button
          v-if="systemSettings.showTermsMenu"
          class="user-menu-item tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
          type="button"
          role="menuitem"
          @click="select('terms')"
        >
          <strong>{{ t("common.terms") }}</strong>
          <small>{{ t("menu.termsSummary") }}</small>
        </button>
        <button
          v-if="systemSettings.showPersonalizationMenu"
          class="user-menu-item tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
          type="button"
          role="menuitem"
          @click="select('personalization')"
        >
          <strong>{{ t("common.personalization") }}</strong>
          <small>{{ t("menu.personalizationSummary") }}</small>
        </button>
        <button
          class="user-menu-item tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
          type="button"
          role="menuitem"
          @click="select('system')"
        >
          <strong>{{ t("common.system") }}</strong>
          <small>{{ t("menu.systemSummary") }}</small>
        </button>
        <button
          v-if="systemSettings.showPlaygroundMenu"
          class="user-menu-item tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
          type="button"
          role="menuitem"
          @click="select('playground')"
        >
          <strong>{{ t("common.playground") }}</strong>
          <small>{{ t("menu.playgroundSummary") }}</small>
        </button>
        <button
          v-if="systemSettings.showLogoutButton"
          class="user-menu-item user-menu-item--danger tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-danger hover:tw-bg-app-controlHover"
          type="button"
          role="menuitem"
          @click="select('logout')"
        >
          <strong>{{ t("common.logout") }}</strong>
          <small>{{ t("menu.logoutSummary") }}</small>
        </button>

        <div
          class="user-menu-language tw-grid tw-gap-1"
          role="group"
          :aria-label="t('common.language')"
        >
          <button
            class="user-menu-item user-menu-item--language tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
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
            <div
              v-if="languageOpen"
              class="user-menu-language-options tw-mt-1 tw-grid tw-gap-1 tw-rounded-xl tw-bg-app-muted tw-p-1"
            >
              <button
                v-for="option in languageOptions"
                :key="option.value"
                class="user-menu-language-option tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
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
import {setAppLocale} from "@/i18n/appI18n";
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
