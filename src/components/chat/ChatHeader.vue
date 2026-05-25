<template>
  <header
    class="mobile-topbar"
    :class="{'mobile-topbar--desktop-main': isDesktopMain}"
  >
    <div class="topbar-left">
      <button
        class="round-icon menu-toggle"
        type="button"
        :aria-label="t('chat.openSidebar')"
        @click="chatActions.openDrawer()"
      >
        <span class="icon-lines"></span>
      </button>

      <button
        v-if="showMobileAssistant"
        class="model-trigger model-trigger--assistant"
        type="button"
        :aria-label="t('chat.assistantSelect')"
        @click="chatActions.openAssistant()"
      >
        <img
          class="assistant-brand-logo assistant-brand-logo--mobile"
          :src="mobileAssistantIcon"
          alt=""
          aria-hidden="true"
        />
        <span>{{ assistantLabel }}</span>
        <ChevronDownIcon class="chevron chevron--selector" />
      </button>

      <div
        v-else-if="showDesktopConversationTitle"
        class="conversation-title-wrap conversation-title-wrap--chat"
      >
        <img
          class="assistant-brand-logo assistant-brand-logo--header"
          :src="headerAssistantIcon"
          alt=""
          aria-hidden="true"
        />
        <strong>{{ assistantLabel }}</strong>
        <span>{{ conversationTitle }}</span>
      </div>

      <div v-else class="conversation-title-wrap conversation-title-wrap--main">
        <img
          class="assistant-brand-logo assistant-brand-logo--desktop"
          :src="desktopAssistantIcon"
          alt=""
          aria-hidden="true"
        />
        <span class="conversation-title-copy">
          <strong>{{ assistantLabel }}</strong>
          <span>{{ t("chat.startQuestion") }}</span>
        </span>
      </div>
    </div>

    <div v-if="isMobile" class="topbar-actions topbar-actions--mobile">
      <button
        class="round-icon mobile-header-future-action"
        type="button"
        :aria-label="t('common.settings')"
        :title="t('common.settings')"
        @click="chatActions.openSettings()"
      >
        <span aria-hidden="true">⋯</span>
      </button>
    </div>

    <div v-else class="topbar-actions topbar-actions--desktop">
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
    </div>
  </header>
</template>

<script setup>
/**
 * @file components/chat/ChatHeader.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, inject} from "vue";
import {storeToRefs} from "pinia";
import {useI18n} from "vue-i18n";
import UserMenu from "@/components/menu/UserMenu.vue";
import SwaggerDocIcon from "@/components/icons/SwaggerDocIcon.vue";
import GuideIcon from "@/components/icons/GuideIcon.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import {getAssistantImageBySize} from "@/constants/assistantImages";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {
  CHAT_ACTIONS_KEY,
  createEmptyChatActions,
} from "@/composables/chat/chatActionContext";

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  mode: {type: String, default: "main"},
  isMobile: {type: Boolean, default: false},
  assistantLabel: {type: String, default: "Assistant"},
  assistant: {type: Object, default: null},
  conversationTitle: {type: String, default: ""},
  themeName: {type: String, default: "dark"},
});

const {t} = useI18n();
const chatActions = inject(CHAT_ACTIONS_KEY, createEmptyChatActions());
const systemSettingsStore = useSystemSettingsStore();
const {settings: systemSettings} = storeToRefs(systemSettingsStore);
const desktopAssistantIcon = computed(() =>
  getAssistantImageBySize(props.assistant, 48)
);
const mobileAssistantIcon = computed(() =>
  getAssistantImageBySize(props.assistant, 20)
);
const headerAssistantIcon = computed(() =>
  getAssistantImageBySize(props.assistant, 20)
);

const isMainPage = computed(() => props.mode === "main");
const isDesktopMain = computed(() => isMainPage.value && !props.isMobile);
const showMobileAssistant = computed(() => props.isMobile);
const showDesktopConversationTitle = computed(
  () => (props.mode === "chat" || props.mode === "shared") && !props.isMobile
);
</script>

<style scoped>
/* Compact mobile header sizing is local to ChatHeader. */
:global(body.mobile-mode) .mobile-topbar {
  height: 44px;
  padding-top: 4px;
  padding-bottom: 4px;
}

:global(body.mobile-mode) .mobile-topbar .round-icon {
  width: 34px;
  height: 34px;
}

:global(body.mobile-mode) .mobile-topbar .model-trigger,
:global(body.mobile-mode) .mobile-topbar .model-trigger--assistant {
  height: 34px;
  min-width: 100px;
  font-size: var(--text-size-title-sm);
  gap: 6px;
  padding-left: 10px;
  padding-right: 10px;
}

:global(body.mobile-mode) .mobile-topbar .topbar-actions--mobile {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
}

:global(body.mobile-mode) .mobile-topbar .mobile-header-future-action {
  font-size: var(--font-size-fixed-22);
  font-weight: 900;
  line-height: 1;
}
</style>
