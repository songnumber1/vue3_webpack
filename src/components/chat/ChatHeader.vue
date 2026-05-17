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
        <span>{{ assistantLabel }}</span>
        <ChevronDownIcon class="chevron chevron--selector" />
      </button>

      <div
        v-else-if="showDesktopConversationTitle"
        class="conversation-title-wrap"
      >
        <strong>{{ assistantLabel }}</strong>
        <span>{{ conversationTitle }}</span>
      </div>

      <div v-else class="conversation-title-wrap conversation-title-wrap--main">
        <strong>{{ assistantLabel }}</strong>
        <span>{{ t("chat.startQuestion") }}</span>
      </div>
    </div>

    <div v-if="!isMobile" class="topbar-actions topbar-actions--desktop">
      <button
        class="round-icon guide-link guide-link--icon"
        type="button"
        :aria-label="t('common.guide')"
        :title="t('common.guide')"
        @click="chatActions.openGuide()"
      >
        <GuideIcon />
      </button>
      <button
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
        @personalization="chatActions.openPersonalization()"
        @language="chatActions.openLanguage()"
        @playground="chatActions.openPlayground()"
      />
    </div>
  </header>
</template>

<script setup>
import {computed, inject} from "vue";
import {useI18n} from "vue-i18n";
import UserMenu from "@/components/menu/UserMenu.vue";
import SwaggerDocIcon from "@/components/icons/SwaggerDocIcon.vue";
import GuideIcon from "@/components/icons/GuideIcon.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import {
  CHAT_ACTIONS_KEY,
  createEmptyChatActions,
} from "@/composables/chat/chatActionContext";

const props = defineProps({
  mode: {type: String, default: "main"},
  isMobile: {type: Boolean, default: false},
  assistantLabel: {type: String, default: "Assistant"},
  conversationTitle: {type: String, default: ""},
  themeName: {type: String, default: "dark"},
});

const {t} = useI18n();
const chatActions = inject(CHAT_ACTIONS_KEY, createEmptyChatActions());
const isDesktopMain = computed(() => props.mode === "main" && !props.isMobile);
const showMobileAssistant = computed(() => props.isMobile);
const showDesktopConversationTitle = computed(
  () => (props.mode === "chat" || props.mode === "shared") && !props.isMobile
);
</script>
