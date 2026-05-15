<!--
@file MobileSettingsPanel.vue
@description Full-screen mobile settings navigation panel. It provides a drawer-like settings index and detail pages for guide, notices, personalization, chat management and language.
-->

<template>
  <teleport to="body">
    <transition name="mobile-page">
      <section v-if="open" class="mobile-settings-page" role="dialog" aria-modal="true">
        <header class="mobile-settings-header">
          <button class="mobile-settings-nav" type="button" @click="handleBack">
            <ChevronLeftIcon class="mobile-settings-back-icon" />
            <span>{{ headerTitle }}</span>
          </button>
          <button
            v-if="activeMenu"
            class="mobile-settings-close"
            type="button"
            :aria-label="t('common.close')"
            @click="closePanel"
          >
            ×
          </button>
        </header>

        <main class="mobile-settings-body">
          <nav v-if="!activeMenu" class="mobile-settings-list" :aria-label="t('common.settings')">
            <button
              v-for="item in menuItems"
              :key="item.key"
              class="mobile-settings-item"
              type="button"
              @click="activeMenu = item.key"
            >
              <span class="mobile-settings-item-icon" aria-hidden="true">{{ item.icon }}</span>
              <span>
                <strong>{{ item.label }}</strong>
                <small>{{ item.description }}</small>
              </span>
              <span class="mobile-settings-item-arrow" aria-hidden="true">›</span>
            </button>
          </nav>

          <section v-else class="mobile-settings-detail">
            <div v-if="activeMenu === 'guide'" class="guide-grid guide-grid--settings">
              <article v-for="section in guideSections" :key="section.title" class="guide-card">
                <span>Guide</span>
                <h2>{{ section.title }}</h2>
                <p>{{ section.body }}</p>
              </article>
            </div>

            <NoticeView v-else-if="activeMenu === 'notice'" />
            <PersonalizationView v-else-if="activeMenu === 'personalization'" />

            <section v-else-if="activeMenu === 'chatManagement'" class="settings-placeholder-card">
              <h3>{{ t('settings.chatManagementTitle') }}</h3>
              <p>{{ t('settings.chatManagementBody') }}</p>
              <ul>
                <li>{{ t('settings.chatManagementArchive') }}</li>
                <li>{{ t('settings.chatManagementExport') }}</li>
                <li>{{ t('settings.chatManagementDelete') }}</li>
              </ul>
            </section>

            <section v-else-if="activeMenu === 'language'" class="settings-language-card">
              <button
                v-for="option in languageOptions"
                :key="option.value"
                class="settings-language-option"
                :class="{ active: locale === option.value }"
                type="button"
                @click="selectLocale(option.value)"
              >
                <span>{{ option.label }}</span>
                <span v-if="locale === option.value" aria-hidden="true">✓</span>
              </button>
            </section>
          </section>
        </main>
      </section>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { setAppLocale } from "@/i18n";
import NoticeView from "@/views/settings/NoticeView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";
import ChevronLeftIcon from "@/components/icons/ChevronLeftIcon.vue";

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(["close"]);
const { t, tm, locale } = useI18n();
const activeMenu = ref("");

const menuItems = computed(() => [
  { key: "guide", icon: "?", label: t("common.guide"), description: t("guide.subtitle") },
  { key: "notice", icon: "!", label: t("common.notice"), description: t("menu.noticeSummary") },
  { key: "personalization", icon: "★", label: t("common.personalization"), description: t("menu.personalizationSummary") },
  { key: "chatManagement", icon: "#", label: t("settings.chatManagement"), description: t("settings.chatManagementSummary") },
  { key: "language", icon: "A", label: t("common.language"), description: t("menu.languageSummary") },
]);
const currentMenu = computed(() => menuItems.value.find((item) => item.key === activeMenu.value));
const headerTitle = computed(() => activeMenu.value ? currentMenu.value?.label || t("common.settings") : t("common.settings"));
const guideSections = computed(() => tm("guide.sections"));
const languageOptions = computed(() => [
  { value: "ko", label: t("common.korean") },
  { value: "en", label: t("common.english") },
]);

/**
 * Moves from a settings detail screen back to the settings index, or closes the panel from the index.
 * @returns {void}
 */
function handleBack() {
  if (activeMenu.value) {
    activeMenu.value = "";
    return;
  }
  closePanel();
}

/**
 * Closes the mobile settings panel and resets the inner navigation state.
 * @returns {void}
 */
function closePanel() {
  activeMenu.value = "";
  emit("close");
}

/**
 * Updates the app locale from the mobile settings language page.
 * @param {'ko'|'en'} value Locale value selected by the user.
 * @returns {void}
 */
function selectLocale(value) {
  setAppLocale(value);
}

watch(() => props.open, (value) => {
  if (!value) activeMenu.value = "";
});
</script>
