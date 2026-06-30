<template>
  <section
    v-if="open"
    class="user-menu-panel tw-absolute tw-right-0 tw-top-[calc(100%+8px)] tw-z-popover tw-grid tw-min-w-[260px] tw-gap-1 tw-rounded-2xl tw-border tw-border-app-border tw-bg-app-surface tw-p-2 tw-text-app-text tw-shadow-menu"
    role="menu"
  >
    <button
      class="user-menu-item tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
      type="button"
      role="menuitem"
      @click="$emit('select', 'notice')"
    >
      <strong>{{ t("common.notice") }}</strong>
      <small>{{ t("menu.noticeSummary") }}</small>
    </button>
    <button
      class="user-menu-item tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
      type="button"
      role="menuitem"
      @click="$emit('select', 'privacy')"
    >
      <strong>{{ t("common.privacy") }}</strong>
      <small>{{ t("menu.privacySummary") }}</small>
    </button>
    <button
      class="user-menu-item tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
      type="button"
      role="menuitem"
      @click="$emit('select', 'terms')"
    >
      <strong>{{ t("common.terms") }}</strong>
      <small>{{ t("menu.termsSummary") }}</small>
    </button>
    <button
      class="user-menu-item tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
      type="button"
      role="menuitem"
      @click="$emit('select', 'personalization')"
    >
      <strong>{{ t("common.personalization") }}</strong>
      <small>{{ t("menu.personalizationSummary") }}</small>
    </button>
    <button
      class="user-menu-item user-menu-item--danger tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-danger hover:tw-bg-app-controlHover"
      type="button"
      role="menuitem"
      @click="$emit('select', 'logout')"
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
        @click="$emit('toggle-language')"
      >
        <span>
          <strong>{{ t("common.language") }}</strong>
          <small>{{ t("menu.languageSummary") }}</small>
        </span>
        <ChevronDownIcon />
      </button>

      <transition name="menu-pop">
        <UserMenuLanguageOptions
          :open="languageOpen"
          :options="languageOptions"
          :current-locale="currentLocale"
          @select-locale="$emit('select-locale', $event)"
        />
      </transition>
    </div>
  </section>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import UserMenuLanguageOptions from "@/components/menu/UserMenuLanguageOptions.vue";

const props = defineProps({
  open: {type: Boolean, default: false},
  languageOpen: {type: Boolean, default: false},
  languageOptions: {type: Array, default: () => []},
  currentLocale: {type: String, default: ""},
});

defineEmits(["select", "toggle-language", "select-locale"]);

const {t} = useI18n();
void props;
</script>
