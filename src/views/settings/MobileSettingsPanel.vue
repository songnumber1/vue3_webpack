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
        >
          <MobileSettingsMenuList
            v-if="!activeMenu"
            @select="selectMenuItem"
          />

          <section
            v-else
            class="mobile-settings-detail"
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

            <MobileSettingsLanguageOptions
              v-else-if="activeMenu === 'language'"
            />
          </section>
        </main>
      </section>
    </transition>
  </teleport>
</template>

<script setup>
/**
 * @file views/settings/MobileSettingsPanel.vue
 * @description 모바일 설정 패널의 페이지 전환 상태만 관리합니다. 메뉴 목록과 언어 옵션은 전용 컴포넌트가 직접 렌더링합니다.
 */

import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import NoticeView from "@/views/settings/NoticeView.vue";
import PrivacyPolicyView from "@/views/settings/PrivacyPolicyView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";
import MobileSettingsLanguageOptions from "@/components/settings/MobileSettingsLanguageOptions.vue";
import MobileSettingsMenuList from "@/components/settings/MobileSettingsMenuList.vue";
import ChevronLeftIcon from "@/components/icons/ChevronLeftIcon.vue";
import {ROUTE_NAMES} from "@/constants/routeNames";

const props = defineProps({
  open: {type: Boolean, default: false},
});
const emit = defineEmits(["close", "applied"]);
const {t, tm} = useI18n();
const router = useRouter();
const activeMenu = ref("");
const headerTitle = computed(() => resolveMenuTitle(activeMenu.value));
const guideSections = computed(() => tm("guide.sections"));

function resolveMenuTitle(key) {
  if (!key) return t("common.settings");
  if (key === "guide") return t("common.guide");
  if (key === "notice") return t("common.notice");
  if (key === "privacy") return t("common.privacy");
  if (key === "personalization") return t("common.personalization");
  if (key === "chatManagement") return t("settings.chatManagement");
  if (key === "language") return t("common.language");
  return t("common.settings");
}

function selectMenuItem(key) {
  if (key === "terms") {
    closePanel();
    router.push({name: ROUTE_NAMES.TERMS}).catch(() => {});
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

watch(
  () => props.open,
  (value) => {
    if (!value) activeMenu.value = "";
  }
);

</script>
