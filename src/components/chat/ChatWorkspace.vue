<template>
  <ChatHeader
    v-if="showChatHeader"
    :mode="mode"
    :assistant-label="assistantLabel"
    :assistant="assistant"
    :conversation-title="conversationTitle"
    :theme-name="themeName"
  />

  <section
    v-if="isMainPage"
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

  <template v-else>
    <MessageList
      ref="listRef"
      :messages="messages"
      :loading="isGenerating"
      :auto-scroll-on-answer="autoScrollOnAnswer"
      :initial-hydrating="isHistoryHydrating"
      @content-rendered="handleMessageContentRendered"
      @history-hydrated="handleHistoryHydrated"
      @regenerate="workspaceActions.regenerate($event)"
    />
    <button
      v-if="showScrollBottom && !isInteractionBlocked"
      class="scroll-bottom-button"
      type="button"
      :aria-label="t('chat.scrollBottom')"
      @click="workspaceActions.scrollBottom()"
    >
      ↓
    </button>
    <div ref="composerSlotRef" class="chat-composer-slot">
      <ChatReadonlyInput v-if="readonly" />
      <ChatReadonlyInput
        v-else-if="isActiveModelUnavailable"
        :variant="isActiveModelDeleted ? 'deleted-model' : 'unavailable-model'"
      />
      <PromptComposer v-else :class="{'mobile-chat-prompt': isMobile}" />
    </div>
  </template>
</template>

<script setup>
/**
 * @file components/chat/ChatWorkspace.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 */

import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import {useI18n} from "vue-i18n";
import ChatHeader from "./ChatHeader.vue";
import ChatReadonlyInput from "./ChatReadonlyInput.vue";
import MessageList from "./MessageList.vue";
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
const listRef = ref(null);
const composerSlotRef = ref(null);
const mainPromptInputRef = ref(null);
let composerResizeObserver = null;
let composerHeightTimerIds = [];

const workspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const workspaceActions = inject(
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions()
);
const {isInteractionBlocked} = useInteractionGuard();

const mode = computed(() => workspaceState.value.mode);
const readonly = computed(() => workspaceState.value.readonly);
const isMobile = computed(() => workspaceState.value.isMobile);
const assistantLabel = computed(() => workspaceState.value.assistantLabel);
const assistant = computed(() => workspaceState.value.assistant);
const conversationTitle = computed(
  () => workspaceState.value.conversationTitle
);
const themeName = computed(() => workspaceState.value.themeName);
const suggestions = computed(() => workspaceState.value.suggestions || []);
const isActiveModelDeleted = computed(
  () => workspaceState.value.isActiveModelDeleted
);
const isActiveModelUnavailable = computed(
  () => workspaceState.value.isActiveModelUnavailable
);
const isGenerating = computed(() => workspaceState.value.isGenerating);
const messages = computed(() => workspaceState.value.messages || []);
const showScrollBottom = computed(() => workspaceState.value.showScrollBottom);
const autoScrollOnAnswer = computed(
  () => workspaceState.value.autoScrollOnAnswer
);
const isHistoryHydrating = computed(
  () => workspaceState.value.isHistoryHydrating
);
const isMainPage = computed(() => mode.value === "main");
const showChatHeader = computed(() => isMobile.value || !isMainPage.value);

const mainAssistantIcon = computed(() =>
  getAssistantImageBySize(assistant.value, 48)
);

const mainPromptClass = computed(() =>
  isMobile.value ? "mobile-main-fixed-prompt" : "desktop-center-prompt"
);

function updateComposerHeight() {
  const height = composerSlotRef.value?.offsetHeight || 0;
  document.documentElement.style.setProperty(
    "--chat-composer-height",
    `${Math.max(height, 72)}px`
  );
}

function scheduleComposerHeightUpdate() {
  if (typeof window === "undefined") {
    updateComposerHeight();
    return;
  }
  composerHeightTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  composerHeightTimerIds = [0, 32, 80, 160].map((delay) =>
    window.setTimeout(updateComposerHeight, delay)
  );
}

function handleMessageContentRendered() {
  workspaceActions.handleMessageContentRendered();
  scheduleComposerHeightUpdate();
}

function handleHistoryHydrated() {
  workspaceActions.handleHistoryHydrated();
  scheduleComposerHeightUpdate();
}

function observeComposerHeight() {
  if (!composerSlotRef.value) return;
  updateComposerHeight();
  if (typeof ResizeObserver !== "undefined") {
    composerResizeObserver = new ResizeObserver(updateComposerHeight);
    composerResizeObserver.observe(composerSlotRef.value);
  }
}

function cleanupComposerHeightObserver() {
  composerHeightTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  composerHeightTimerIds = [];
  composerResizeObserver?.disconnect();
  composerResizeObserver = null;
}

onMounted(async () => {
  await nextTick();
  observeComposerHeight();
});

onBeforeUnmount(cleanupComposerHeightObserver);

function handleSuggestionClick(item) {
  if (isInteractionBlocked.value) return;
  const prompt = item?.prompt || item?.title || item?.text || "";
  mainPromptInputRef.value?.setText(prompt, {focus: true});
}

watch(
  () => [
    readonly.value,
    mode.value,
    showScrollBottom.value,
    isActiveModelUnavailable.value,
    isGenerating.value,
    isHistoryHydrating.value,
    messages.value.length,
  ],
  async () => {
    await nextTick();
    scheduleComposerHeightUpdate();
  }
);

defineExpose({
  listRef,
});
</script>

<style scoped lang="scss">
/* Mobile main/chat composer geometry is owned by ChatWorkspace because this
   component decides whether the shared prompt composer is rendered as main or chat. */
:global(body.mobile-mode) .mobile-chat-prompt,
:global(body.mobile-mode) .mobile-main-fixed-prompt {
  width: 100%;
  max-width: none;
}

:global(body.mobile-mode) .mobile-main-fixed-prompt,
:global(body.mobile-mode) .mobile-main-fixed-prompt.prompt-wrap {
  background: transparent;
  box-shadow: none;
}

:global(body.mobile-mode) .mobile-chat-prompt :deep(.prompt-box--gemini),
:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.prompt-box--gemini) {
  align-items: stretch;
}

:global(body.mobile-mode) .mobile-chat-prompt :deep(.prompt-action-row),
:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.prompt-action-row) {
  display: flex;
  width: 100%;
  min-width: 0;
  align-self: stretch;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

:global(body.mobile-mode) .mobile-chat-prompt :deep(.prompt-left-actions),
:global(body.mobile-mode)
  .mobile-main-fixed-prompt
  :deep(.prompt-left-actions) {
  display: flex;
  flex: 0 1 auto;
  width: auto;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin: 0;
}

:global(body.mobile-mode) .mobile-chat-prompt :deep(.send-button),
:global(body.mobile-mode) .mobile-chat-prompt :deep(.voice-button),
:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.send-button),
:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.voice-button) {
  flex: 0 0 auto;
  margin-left: auto;
}
</style>
