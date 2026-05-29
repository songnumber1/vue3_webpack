<template>
  <ChatHeader
    v-if="isMobile"
    mode="main"
    :is-mobile="isMobile"
    :assistant-label="assistantLabel"
    :assistant="assistant"
    :conversation-title="conversationTitle"
    :theme-name="themeName"
  />

  <section
    class="empty-stage empty-stage--main"
    :class="{'empty-stage--mobile-main': isMobile}"
  >
    <div class="empty-center">
      <img
        class="empty-assistant-logo"
        :src="mainAssistantIcon"
        :alt="assistantLabel"
      />
      <h1>{{ t("chat.startQuestion") }}</h1>
      <div class="suggestion-row suggestion-row--between">
        <button
          v-for="item in suggestions"
          :key="item.id || item.text"
          class="suggestion-chip"
          type="button"
          :title="item.title || item.prompt"
          :disabled="false"
          @click="handleSuggestionClick(item)"
        >
          <span v-if="item.icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="suggestion-chip-text">{{ item.text }}</span>
        </button>
      </div>
      <PromptComposer ref="mainPromptInputRef" :class="mainPromptClass" />
    </div>
  </section>
</template>

<script setup>
/**
 * @file components/workspace/MainWorkspace.vue
 * @description 기존 ChatWorkspace의 메인 화면 렌더링만 분리한 라우트 전용 workspace입니다.
 */
import {computed, inject, ref} from "vue";
import {useI18n} from "vue-i18n";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import {
  CHAT_WORKSPACE_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatActionContext";
import {getAssistantImageBySize} from "@/constants/assistantImages";
import {useInteractionGuard} from "@/composables/runtime/useInteractionGuard";

const {t} = useI18n();
const mainPromptInputRef = ref(null);
const workspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
inject(WORKSPACE_ACTIONS_KEY, createEmptyWorkspaceActions());
const {isInteractionBlocked} = useInteractionGuard();

const isMobile = computed(() => workspaceState.value.isMobile);
const assistantLabel = computed(() => workspaceState.value.assistantLabel);
const assistant = computed(() => workspaceState.value.assistant);
const conversationTitle = computed(
  () => workspaceState.value.conversationTitle
);
const themeName = computed(() => workspaceState.value.themeName);
const suggestions = computed(() => workspaceState.value.suggestions || []);
const mainAssistantIcon = computed(() =>
  getAssistantImageBySize(assistant.value, 48)
);
const mainPromptClass = computed(() =>
  isMobile.value ? "mobile-main-fixed-prompt" : "desktop-center-prompt"
);

function handleSuggestionClick(item) {
  if (isInteractionBlocked.value) return;
  const prompt = item?.prompt || item?.title || item?.text || "";
  mainPromptInputRef.value?.setText(prompt, {focus: true});
}
</script>

<style scoped lang="scss">
/* 기존 메인 composer 모바일 보정은 메인 workspace가 소유합니다. */
:global(body.mobile-mode) .mobile-main-fixed-prompt {
  width: 100%;
  max-width: none;
}

:global(body.mobile-mode) .mobile-main-fixed-prompt,
:global(body.mobile-mode) .mobile-main-fixed-prompt.prompt-wrap {
  background: transparent;
  box-shadow: none;
}

:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.prompt-box--gemini) {
  align-items: stretch;
}

:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.prompt-action-row) {
  display: flex;
  width: 100%;
  min-width: 0;
  align-self: stretch;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.prompt-left-actions) {
  display: flex;
  flex: 0 1 auto;
  width: auto;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin: 0;
}

:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.send-button),
:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.voice-button) {
  flex: 0 0 auto;
  margin-left: auto;
}
</style>
