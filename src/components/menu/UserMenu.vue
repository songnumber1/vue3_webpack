<template>
  <div ref="menuRef" class="user-menu" :class="{'user-menu--open': open}">
    <button
      class="user-menu-trigger"
      type="button"
      :aria-label="t('common.user')"
      @click="toggleOpen"
    >
      <span class="user-avatar user-avatar--header">{{ userInitial }}</span>
      <span class="user-menu-name">{{ displayName }}</span>
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
          @click="select('privacy')"
        >
          <strong>{{ t("common.privacy") }}</strong>
          <small>{{ t("menu.privacySummary") }}</small>
        </button>
        <button
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('terms')"
        >
          <strong>{{ t("common.terms") }}</strong>
          <small>{{ t("menu.termsSummary") }}</small>
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
import {storeToRefs} from "pinia";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import {setAppLocale} from "@/i18n";
import {useOutsideClick} from "@/composables/useOutsideClick";
import {useAuthStore} from "@/stores/authStore";

const emit = defineEmits([
  "notice",
  "privacy",
  "terms",
  "personalization",
  "playground",
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

function toggleOpen() {
  open.value = !open.value;
  if (!open.value) languageOpen.value = false;
}

function toggleLanguageOpen() {
  languageOpen.value = !languageOpen.value;
}

function select(action) {
  open.value = false;
  languageOpen.value = false;
  emit(action);
}

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
