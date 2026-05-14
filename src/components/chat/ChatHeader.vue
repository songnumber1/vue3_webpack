<!--
@file ChatHeader.vue
@description Chat workspace header with mobile navigation and desktop user controls.
-->

<template>
  <header
    class="mobile-topbar"
    :class="{ 'mobile-topbar--desktop-main': isDesktopMain }"
  >
    <div class="topbar-left">
      <button
        class="round-icon menu-toggle"
        type="button"
        :aria-label="t('chat.openSidebar')"
        @click="$emit('open-drawer')"
      >
        <span class="icon-lines"></span>
      </button>

      <button
        v-if="showMobileAssistant"
        class="model-trigger model-trigger--assistant"
        type="button"
        :aria-label="t('chat.assistantSelect')"
        @click="$emit('open-assistant')"
      >
        <span>{{ assistantLabel }}</span>
        <svg class="chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M5.5 7.5 10 12l4.5-4.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
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
        @click="$emit('open-guide')"
      >
        <GuideIcon />
      </button>
      <button
        class="round-icon theme-toggle"
        type="button"
        :aria-label="t('common.theme')"
        @click="$emit('toggle-theme')"
      >
        <span
          class="theme-glyph"
          :class="{ 'theme-glyph--dark': themeName === 'dark' }"
        ></span>
      </button>
      <button
        class="round-icon document-toggle"
        type="button"
        :aria-label="t('common.swagger')"
        :title="t('common.swagger')"
        @click="$emit('open-swagger')"
      >
        <SwaggerDocIcon />
      </button>
      <UserMenu
        @notice="$emit('open-notice')"
        @personalization="$emit('open-personalization')"
        @language="$emit('open-language')"
      />
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import UserMenu from "@/components/menu/UserMenu.vue";
import SwaggerDocIcon from "@/components/icons/SwaggerDocIcon.vue";
import GuideIcon from "@/components/icons/GuideIcon.vue";

const props = defineProps({
  mode: { type: String, default: "main" },
  isMobile: { type: Boolean, default: false },
  assistantLabel: { type: String, default: "Assistant" },
  conversationTitle: { type: String, default: "" },
  themeName: { type: String, default: "dark" },
});

defineEmits([
  "toggle-theme",
  "open-drawer",
  "open-swagger",
  "open-settings",
  "open-assistant",
  "open-guide",
  "open-notice",
  "open-personalization",
  "open-language",
]);

const { t } = useI18n();
const isDesktopMain = computed(() => props.mode === "main" && !props.isMobile);
const showMobileAssistant = computed(() => props.isMobile);
const showDesktopConversationTitle = computed(
  () => (props.mode === "chat" || props.mode === "shared") && !props.isMobile,
);
</script>
