<template>
  <header class="application-header" :aria-label="t('application.headerLabel')">
    <div class="application-header__brand">
      <strong class="application-header__title">{{ t("application.title") }}</strong>
      <span class="application-header__subtitle">{{ t("application.subtitle") }}</span>
    </div>

    <nav class="application-header__actions" :aria-label="t('application.userMenuLabel')">
      <button
        v-if="systemSettings.showGuideButton"
        class="round-icon guide-link guide-link--icon"
        type="button"
        :aria-label="t('common.guide')"
        :title="t('common.guide')"
        @click="chatActions.openGuide()"
      >
        <GuideIcon />
      </button>
      <button
        v-if="systemSettings.showThemeButton"
        class="round-icon theme-toggle"
        type="button"
        :aria-label="t('common.theme')"
        :title="t('common.theme')"
        @click="chatActions.toggleTheme()"
      >
        <span
          class="theme-glyph"
          :class="{'theme-glyph--dark': themeName === 'dark'}"
        ></span>
      </button>
      <button
        v-if="systemSettings.showSwaggerButton"
        class="round-icon document-toggle"
        type="button"
        :aria-label="t('common.swagger')"
        :title="t('common.swagger')"
        @click="chatActions.openSwagger()"
      >
        <SwaggerDocIcon />
      </button>
      <UserMenu
        @notice="chatActions.openNotice()"
        @privacy="chatActions.openPrivacy()"
        @terms="chatActions.openTerms()"
        @personalization="chatActions.openPersonalization()"
        @system="chatActions.openSystem()"
        @language="chatActions.openLanguage()"
        @playground="chatActions.openPlayground()"
        @logout="chatActions.logout()"
      />
    </nav>
  </header>
</template>

<script setup>
/**
 * PC 전용 application header입니다.
 * 기존 ChatHeader의 데스크톱 우측 액션을 이 컴포넌트로 이동하여,
 * ChatHeader는 대화방/워크스페이스 헤더 역할만 유지합니다.
 */

import {computed, inject} from "vue";
import {storeToRefs} from "pinia";
import {useI18n} from "vue-i18n";
import UserMenu from "@/components/menu/UserMenu.vue";
import SwaggerDocIcon from "@/components/icons/SwaggerDocIcon.vue";
import GuideIcon from "@/components/icons/GuideIcon.vue";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {
  CHAT_ACTIONS_KEY,
  CHAT_WORKSPACE_STATE_KEY,
  createEmptyChatActions,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatActionContext";

const {t} = useI18n();
const chatActions = inject(CHAT_ACTIONS_KEY, createEmptyChatActions());
const workspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const systemSettingsStore = useSystemSettingsStore();
const {settings: systemSettings} = storeToRefs(systemSettingsStore);
const themeName = computed(() => workspaceState.value.themeName || "light");
</script>
