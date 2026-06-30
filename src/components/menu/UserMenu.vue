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
      <UserMenuPanel
        :open="open"
        :language-open="languageOpen"
        :language-options="languageOptions"
        :current-locale="currentLocale"
        @select="select"
        @toggle-language="toggleLanguageOpen"
        @select-locale="selectLocale"
      />
    </transition>
  </div>
</template>

<script setup>
/**
 * @file components/menu/UserMenu.vue
 * @description 전역 사용자 메뉴의 트리거와 열림 상태만 관리합니다. 실제 메뉴 항목은 UserMenuPanel에서 직접 렌더링합니다.
 */

import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import UserMenuPanel from "@/components/menu/UserMenuPanel.vue";
import {setAppLocale} from "@/i18n/appI18n";
import {useOutsideClick} from "@/composables/events/useOutsideClick";
import {useAuthStore} from "@/stores/authStore";

const emit = defineEmits([
  "notice",
  "privacy",
  "terms",
  "personalization",
  "playground",
  "logout",
]);
const {t, locale} = useI18n();
const authStore = useAuthStore();
const {userName} = storeToRefs(authStore);

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

function closeMenu() {
  open.value = false;
  languageOpen.value = false;
}

function toggleOpen() {
  open.value = !open.value;
  if (!open.value) languageOpen.value = false;
}

function toggleLanguageOpen() {
  languageOpen.value = !languageOpen.value;
}

function select(action) {
  closeMenu();
  emit(action);
}

function selectLocale(value) {
  setAppLocale(value);
  closeMenu();
}

useOutsideClick(() => menuRef.value, closeMenu);
</script>
