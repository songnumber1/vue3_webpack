<!--
@file ChatHeader.vue * @description Vue component used in the chat web
application runtime. * @author OpenAI
-->

<template>
  <header class="mobile-topbar" :class="{ 'mobile-topbar--desktop-main': isDesktopMain }">
    <div class="topbar-left">
      <button
        class="round-icon menu-toggle"
        type="button"
        aria-label="메뉴 열기"
        @click="$emit('open-drawer')"
      >
        <span class="icon-lines"></span>
      </button>

      <button
        v-if="showMobileAssistant"
        class="model-trigger model-trigger--assistant"
        type="button"
        aria-label="Assistant 선택"
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

      <div v-else-if="showDesktopConversationTitle" class="conversation-title-wrap">
        <strong>{{ assistantLabel }}</strong>
        <span>{{ conversationTitle }}</span>
      </div>
    </div>

    <div class="topbar-actions">
      <button
        class="round-icon theme-toggle"
        type="button"
        aria-label="테마 전환"
        @click="$emit('toggle-theme')"
      >
        <span class="theme-glyph" :class="{ 'theme-glyph--dark': themeName === 'dark' }"></span>
      </button>
      <button
        class="round-icon document-toggle"
        type="button"
        aria-label="Swagger 문서"
        title="Swagger 문서"
        @click="$emit('open-swagger')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 3.5h7.2L19 8.3V20a.5.5 0 0 1-.5.5h-11A2.5 2.5 0 0 1 5 18V5.5A2 2 0 0 1 7 3.5Z"
          />
          <path d="M14 3.5V8h4.5" />
          <path d="M8.5 12h7" />
          <path d="M8.5 15.5h7" />
        </svg>
      </button>
      <button
        class="round-icon settings-toggle"
        type="button"
        aria-label="설정"
        title="설정"
        @click="$emit('open-settings')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-2.1.4l-.1.1-3.4-2-.1-.2a1.7 1.7 0 0 0-1.8-1.1h-.2l-2 3.4-3.4-2 .1-.2a1.7 1.7 0 0 0-.4-2.1l-.1-.1 2-3.4.2.1A1.7 1.7 0 0 0 7.4 13v-.2a1.7 1.7 0 0 0 0-1.6V11l-3.4-2 2-3.4.2.1a1.7 1.7 0 0 0 2.1-.4l.1-.1 3.4 2 .1.2a1.7 1.7 0 0 0 1.8 1.1h.2l2-3.4 3.4 2-.1.2a1.7 1.7 0 0 0 .4 2.1l.1.1-2 3.4-.2-.1A1.7 1.7 0 0 0 16.6 13v.2a1.7 1.7 0 0 0 2.8 1.8Z"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  mode: { type: String, default: "main" },
  isMobile: { type: Boolean, default: false },
  assistantLabel: { type: String, default: "Assistant" },
  conversationTitle: { type: String, default: "" },
  themeName: { type: String, default: "dark" }
});

defineEmits(["toggle-theme", "open-drawer", "open-swagger", "open-settings", "open-assistant"]);

const isDesktopMain = computed(() => props.mode === "main" && !props.isMobile);
const showMobileAssistant = computed(() => props.isMobile);
const showDesktopConversationTitle = computed(
  () => (props.mode === "chat" || props.mode === "shared") && !props.isMobile
);
</script>
