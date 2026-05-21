<template>
  <teleport to="body">
    <transition name="mobile-page">
      <section
        v-if="open"
        class="mobile-settings-page"
        role="dialog"
        aria-modal="true"
      >
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

        <main
          class="mobile-settings-body"
          :class="{'mobile-settings-body--system': activeMenu === 'system'}"
        >
          <nav
            v-if="!activeMenu"
            class="mobile-settings-list"
            :aria-label="t('common.settings')"
          >
            <button
              v-for="item in menuItems"
              :key="item.key"
              class="mobile-settings-item"
              type="button"
              @click="selectMenuItem(item.key)"
            >
              <img class="mobile-settings-item-icon" :src="item.iconSrc" alt="" aria-hidden="true" />
              <span>
                <strong>{{ item.label }}</strong>
                <small>{{ item.description }}</small>
              </span>
              <span class="mobile-settings-item-arrow" aria-hidden="true"
                ><ChevronRightIcon
              /></span>
            </button>
          </nav>

          <section
            v-else
            class="mobile-settings-detail"
            :class="{'mobile-settings-detail--system': activeMenu === 'system'}"
          >
            <div
              v-if="activeMenu === 'guide'"
              class="guide-grid guide-grid--settings"
            >
              <article
                v-for="section in guideSections"
                :key="section.title"
                class="guide-card"
              >
                <span>Guide</span>
                <h2>{{ section.title }}</h2>
                <p>{{ section.body }}</p>
              </article>
            </div>

            <NoticeView v-else-if="activeMenu === 'notice'" />
            <PrivacyPolicyView v-else-if="activeMenu === 'privacy'" />
            <PersonalizationView v-else-if="activeMenu === 'personalization'" />
            <SystemSettingsView
              v-else-if="activeMenu === 'system'"
              @close="closePanel"
            />

            <section
              v-else-if="activeMenu === 'chatManagement'"
              class="settings-placeholder-card"
            >
              <h3>{{ t("settings.chatManagementTitle") }}</h3>
              <p>{{ t("settings.chatManagementBody") }}</p>
              <ul>
                <li>{{ t("settings.chatManagementArchive") }}</li>
                <li>{{ t("settings.chatManagementExport") }}</li>
                <li>{{ t("settings.chatManagementDelete") }}</li>
              </ul>
            </section>

            <section
              v-else-if="activeMenu === 'language'"
              class="settings-language-card"
            >
              <button
                v-for="option in languageOptions"
                :key="option.value"
                class="settings-language-option"
                :class="{active: locale === option.value}"
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
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {setAppLocale} from "@/i18n";
import NoticeView from "@/views/settings/NoticeView.vue";
import PrivacyPolicyView from "@/views/settings/PrivacyPolicyView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";
import SystemSettingsView from "@/views/settings/SystemSettingsView.vue";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {storeToRefs} from "pinia";
import ChevronLeftIcon from "@/components/icons/ChevronLeftIcon.vue";
import ChevronRightIcon from "@/components/icons/ChevronRightIcon.vue";
import chatManagementIcon from "@/assets/img/icons/chat-management.svg";
import guideIcon from "@/assets/img/icons/question.svg";
import languageIcon from "@/assets/img/icons/language.svg";
import noticeIcon from "@/assets/img/icons/info.svg";
import personalizationIcon from "@/assets/img/icons/personalization.svg";
import privacyIcon from "@/assets/img/icons/privacy.svg";
import settingsIcon from "@/assets/img/icons/settings.svg";
import termsIcon from "@/assets/img/icons/terms.svg";

const props = defineProps({
  open: {type: Boolean, default: false},
  isMobile: {type: Boolean, default: true},
});
const emit = defineEmits(["close", "desktop-open"]);
const {t, tm, locale} = useI18n();
const router = useRouter();
const systemSettingsStore = useSystemSettingsStore();
const {settings: systemSettings} = storeToRefs(systemSettingsStore);
const activeMenu = ref("");

const menuItems = computed(() =>
  [
    {
      key: "guide",
      iconSrc: guideIcon,
      label: t("common.guide"),
      description: t("guide.subtitle"),
      visible: systemSettings.value.showGuideButton,
    },
    {
      key: "notice",
      iconSrc: noticeIcon,
      label: t("common.notice"),
      description: t("menu.noticeSummary"),
      visible: systemSettings.value.showNoticeMenu,
    },
    {
      key: "privacy",
      iconSrc: privacyIcon,
      label: t("common.privacy"),
      description: t("menu.privacySummary"),
      visible: systemSettings.value.showPrivacyMenu,
    },
    {
      key: "terms",
      iconSrc: termsIcon,
      label: t("common.terms"),
      description: t("menu.termsSummary"),
      visible: systemSettings.value.showTermsMenu,
    },
    {
      key: "personalization",
      iconSrc: personalizationIcon,
      label: t("common.personalization"),
      description: t("menu.personalizationSummary"),
      visible: systemSettings.value.showPersonalizationMenu,
    },
    {
      key: "system",
      iconSrc: settingsIcon,
      label: "시스템",
      description: "앱 동작과 화면 노출 설정을 관리합니다.",
      visible: true,
    },
    {
      key: "chatManagement",
      iconSrc: chatManagementIcon,
      label: t("settings.chatManagement"),
      description: t("settings.chatManagementSummary"),
      visible: true,
    },
    {
      key: "language",
      iconSrc: languageIcon,
      label: t("common.language"),
      description: t("menu.languageSummary"),
      visible: true,
    },
  ].filter((item) => item.visible)
);
const currentMenu = computed(() =>
  menuItems.value.find((item) => item.key === activeMenu.value)
);
const headerTitle = computed(() =>
  activeMenu.value
    ? currentMenu.value?.label || t("common.settings")
    : t("common.settings")
);
const guideSections = computed(() => tm("guide.sections"));
const languageOptions = computed(() => [
  {value: "ko", label: t("common.korean")},
  {value: "en", label: t("common.english")},
]);
function selectMenuItem(key) {
  if (key === "terms") {
    closePanel();
    router.push({name: "terms"}).catch(() => {});
    return;
  }
  activeMenu.value = key;
}

function handleBack() {
  if (activeMenu.value) {
    activeMenu.value = "";
    return;
  }
  closePanel();
}
function closePanel() {
  activeMenu.value = "";
  emit("close");
}
function selectLocale(value) {
  setAppLocale(value);
}

watch(
  () => props.open,
  (value) => {
    if (!value) activeMenu.value = "";
  }
);

watch(
  () => [props.open, props.isMobile],
  ([open, isMobile]) => {
    if (!open || isMobile) return;
    emit("desktop-open", activeMenu.value || "personalization");
    activeMenu.value = "";
  }
);
</script>
