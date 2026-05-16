<!--
@file UserMenu.vue
@description Desktop user selector menu with guide, notices, personalization and inline language selector.
-->

<template>
  <div ref="menuRef" class="user-menu" :class="{'user-menu--open': open}">
    <button
      class="user-menu-trigger"
      type="button"
      :aria-label="t('common.user')"
      @click="toggleOpen"
    >
      <span class="user-avatar user-avatar--header">민</span>
      <span class="user-menu-name">민우 송</span>
      <ChevronDownIcon class="user-menu-chevron-icon" />
    </button>

    <transition name="menu-pop">
      <section v-if="open" class="user-menu-panel" role="menu">
        <button
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('notice')"
        >
          <strong>{{ t("common.notice") }}</strong>
          <small>{{ t("menu.noticeSummary") }}</small>
        </button>
        <button
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
          @click="select('playground')"
        >
          <strong>{{ t("common.playground") }}</strong>
          <small>{{ t("menu.playgroundSummary") }}</small>
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
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import {setAppLocale} from "@/i18n";
import {useOutsideClick} from '@/composables/useOutsideClick';

const emit = defineEmits(["notice", "personalization", "playground"]);
const {t, locale} = useI18n();
const open = ref(false);
const languageOpen = ref(false);
const menuRef = ref(null);
const currentLocale = computed(() => locale.value);
const languageOptions = computed(() => [
  {value: "ko", label: t("common.korean")},
  {value: "en", label: t("common.english")},
]);

/**
 * Toggles the desktop user dropdown menu.
 * @returns {void}
 */
function toggleOpen() {
  open.value = !open.value;
  if (!open.value) languageOpen.value = false;
}

/**
 * Toggles the nested language selector inside the desktop user menu.
 * @returns {void}
 */
function toggleLanguageOpen() {
  languageOpen.value = !languageOpen.value;
}

/**
 * Emits a selected user-menu action and closes the menu.
 * @param {'notice'|'personalization'|'playground'} action Selected action key.
 * @returns {void}
 */
function select(action) {
  open.value = false;
  languageOpen.value = false;
  emit(action);
}

/**
 * Applies the selected locale without leaving the desktop selector menu in a broken state.
 * @param {'ko'|'en'} value Locale code selected by the user.
 * @returns {void}
 */
function selectLocale(value) {
  setAppLocale(value);
  open.value = false;
  languageOpen.value = false;
}


useOutsideClick(
  () => menuRef.value,
  () => {
    open.value = false;
    languageOpen.value = false;
  }
);

</script>
