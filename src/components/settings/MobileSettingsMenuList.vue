<template>
  <nav class="mobile-settings-list" :aria-label="t('common.settings')">
    <button
      v-if="systemSettings.showGuideButton"
      class="mobile-settings-item"
      type="button"
      @click="$emit('select', 'guide')"
    >
      <span class="mobile-settings-item-icon" aria-hidden="true">
        <img :src="guideIcon" alt="" />
      </span>
      <span>
        <strong>{{ t("common.guide") }}</strong>
        <small>{{ t("guide.subtitle") }}</small>
      </span>
      <span class="mobile-settings-item-arrow" aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </button>

    <button
      v-if="systemSettings.showNoticeMenu"
      class="mobile-settings-item"
      type="button"
      @click="$emit('select', 'notice')"
    >
      <span class="mobile-settings-item-icon" aria-hidden="true">
        <img :src="noticeIcon" alt="" />
      </span>
      <span>
        <strong>{{ t("common.notice") }}</strong>
        <small>{{ t("menu.noticeSummary") }}</small>
      </span>
      <span class="mobile-settings-item-arrow" aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </button>

    <button
      v-if="systemSettings.showPrivacyMenu"
      class="mobile-settings-item"
      type="button"
      @click="$emit('select', 'privacy')"
    >
      <span class="mobile-settings-item-icon" aria-hidden="true">
        <img :src="privacyIcon" alt="" />
      </span>
      <span>
        <strong>{{ t("common.privacy") }}</strong>
        <small>{{ t("menu.privacySummary") }}</small>
      </span>
      <span class="mobile-settings-item-arrow" aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </button>

    <button
      v-if="systemSettings.showTermsMenu"
      class="mobile-settings-item"
      type="button"
      @click="$emit('select', 'terms')"
    >
      <span class="mobile-settings-item-icon" aria-hidden="true">
        <img :src="termsIcon" alt="" />
      </span>
      <span>
        <strong>{{ t("common.terms") }}</strong>
        <small>{{ t("menu.termsSummary") }}</small>
      </span>
      <span class="mobile-settings-item-arrow" aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </button>

    <button
      v-if="systemSettings.showPersonalizationMenu"
      class="mobile-settings-item"
      type="button"
      @click="$emit('select', 'personalization')"
    >
      <span class="mobile-settings-item-icon" aria-hidden="true">
        <img :src="personalizationIcon" alt="" />
      </span>
      <span>
        <strong>{{ t("common.personalization") }}</strong>
        <small>{{ t("menu.personalizationSummary") }}</small>
      </span>
      <span class="mobile-settings-item-arrow" aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </button>

    <button class="mobile-settings-item" type="button" @click="$emit('select', 'system')">
      <span class="mobile-settings-item-icon" aria-hidden="true">
        <img :src="systemIcon" alt="" />
      </span>
      <span>
        <strong>{{ t("common.system") }}</strong>
        <small>{{ t("menu.systemSummary") }}</small>
      </span>
      <span class="mobile-settings-item-arrow" aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </button>

    <button
      v-if="systemSettings.showPlaygroundMenu"
      class="mobile-settings-item"
      type="button"
      @click="$emit('select', 'playground')"
    >
      <span class="mobile-settings-item-icon" aria-hidden="true">
        <img :src="playgroundIcon" alt="" />
      </span>
      <span>
        <strong>{{ t("common.playground") }}</strong>
        <small>{{ t("menu.playgroundSummary") }}</small>
      </span>
      <span class="mobile-settings-item-arrow" aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </button>

    <button
      class="mobile-settings-item"
      type="button"
      @click="$emit('select', 'chatManagement')"
    >
      <span class="mobile-settings-item-icon" aria-hidden="true">
        <img :src="chatManagementIcon" alt="" />
      </span>
      <span>
        <strong>{{ t("settings.chatManagement") }}</strong>
        <small>{{ t("settings.chatManagementSummary") }}</small>
      </span>
      <span class="mobile-settings-item-arrow" aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </button>

    <button class="mobile-settings-item" type="button" @click="$emit('select', 'language')">
      <span class="mobile-settings-item-icon" aria-hidden="true">
        <img :src="languageIcon" alt="" />
      </span>
      <span>
        <strong>{{ t("common.language") }}</strong>
        <small>{{ t("menu.languageSummary") }}</small>
      </span>
      <span class="mobile-settings-item-arrow" aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </button>
  </nav>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import ChevronRightIcon from "@/components/icons/ChevronRightIcon.vue";
import guideIcon from "@/assets/img/settings/guide.svg";
import noticeIcon from "@/assets/img/settings/notice.svg";
import privacyIcon from "@/assets/img/settings/privacy.svg";
import termsIcon from "@/assets/img/settings/terms.svg";
import personalizationIcon from "@/assets/img/settings/personalization.svg";
import systemIcon from "@/assets/img/settings/system.svg";
import chatManagementIcon from "@/assets/img/settings/chat-management.svg";
import languageIcon from "@/assets/img/settings/language.svg";
import playgroundIcon from "@/assets/img/settings/playground.svg";

defineProps({
  systemSettings: {type: Object, required: true},
});

defineEmits(["select"]);

const {t} = useI18n();
</script>
