<template>
  <ChatHeader
    :mode="mode"
    :assistant-label="assistantLabel"
    :assistant="assistant"
    :conversation-title="conversationTitle"
    :theme-name="themeName"
    :show-studio-detail-button="showStudioDetailButton"
    :studio-detail-disabled="studioDetailDisabled"
  />

  <MessageList
    ref="listRef"
    :visible="!isPromptExpandedInChat"
    :messages="messages"
    :loading="isGenerating"
    :history-rendering="isHistoryRendering"
    :history-markdown-visible="historyMarkdownVisible"
    :history-messages-ready="historyMessagesLoaded"
    :history-render-key="historyRenderKey"
    :message-render-policy="messageRenderPolicy"
    :readonly="readonly"
  />
  <button
    v-if="
      showScrollBottom &&
      !chatPageLock.isScrollButtonBlocked.value &&
      !isPromptExpandedInChat &&
      !isHistoryRendering
    "
    class="scroll-bottom-button"
    type="button"
    :aria-label="t('chat.scrollBottom')"
    @click="scrollBottom"
  >
    ↓
  </button>
  <div
    v-show="isComposerVisible"
    ref="composerSlotRef"
    class="chat-composer-slot"
    :aria-hidden="isComposerVisible ? null : 'true'"
  >
    <ChatReadonlyInput v-if="readonly" :variant="readonlyInputVariant" />
    <ChatReadonlyInput
      v-else-if="isActiveModelUnavailable"
      :variant="readonlyInputVariant"
    />
    <PromptComposer
      v-else
      ref="promptComposerRef"
      :class="{
        'mobile-chat-prompt': isMobile,
        'mobile-keyboard-dock': isMobile,
      }"
    />
  </div>

</template>

<script setup>
/**
 * @file components/workspace/ChatConversationWorkspace.vue
 * @description 기존 통합 채팅 workspace의 대화방 렌더링만 분리한 라우트 전용 workspace입니다.
 */
import {
  computed,
  inject,
  ref,
  watch,
} from "vue";
import {useI18n} from "vue-i18n";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import ChatReadonlyInput from "@/components/chat/ChatReadonlyInput.vue";
import MessageList from "@/components/chat/MessageList.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import {useChatStore} from "@/stores/chatStore";
import {useConversationComposerHeight} from "@/composables/chat/conversation/useConversationComposerHeight";
import {isStudioAssistant} from "@/composables/studio/useStudioDetailModel";
import {
  CHAT_WORKSPACE_STATE_KEY,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatStateContext";
import {resolveBooleanSource} from "@/utils/interactionGuard";
import {useChatWorkspaceActions} from "@/composables/chat/context/chatWorkspaceActionContext";
import {providePromptWorkspaceLayoutActions} from "@/composables/prompt/context/promptWorkspaceLayoutContext";
import {
  provideMessageActions,
  useMessageActions,
} from "@/composables/chat/context/messageActionContext";

const {t} = useI18n();
const listRef = ref(null);
const composerSlotRef = ref(null);
const promptComposerRef = ref(null);
const isPromptExpandedInChat = ref(false);

const workspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const chatWorkspaceActions = useChatWorkspaceActions();
const parentMessageActions = useMessageActions();
const chatStore = useChatStore();
const mode = computed(() => workspaceState.value.mode);
const activeChatId = computed(() => chatStore.selectedChatId || "");
const readonly = computed(() => workspaceState.value.readonly);
const isMobile = computed(() => workspaceState.value.isMobile);
const assistantLabel = computed(() => workspaceState.value.assistantLabel);
const assistant = computed(() => workspaceState.value.assistant);
const conversationTitle = computed(
  () => workspaceState.value.conversationTitle
);
const themeName = computed(() => workspaceState.value.themeName);
const showStudioDetailButton = computed(() =>
  isStudioAssistant(assistant.value)
);
const studioDetailDisabled = computed(
  () =>
    isGenerating.value ||
    isHistoryRendering.value ||
    workspaceState.value.isActiveModelUnavailable
);
const isActiveModelDeleted = computed(
  () => workspaceState.value.isActiveModelDeleted
);
const isActiveModelUnavailable = computed(
  () => workspaceState.value.isActiveModelUnavailable
);
const readonlyInputVariant = computed(() => {
  if (readonly.value) return "shared";
  return isActiveModelDeleted.value ? "deleted-model" : "unavailable-model";
});
const isGenerating = computed(() => workspaceState.value.isGenerating);
const messages = computed(() => workspaceState.value.messages || []);
const showScrollBottom = computed(() => workspaceState.value.showScrollBottom);
const isHistoryRendering = computed(
  () => workspaceState.value.isHistoryRendering
);
const historyMarkdownVisible = computed(
  () => workspaceState.value.historyMarkdownVisible
);
const isComposerVisible = computed(
  () => !isHistoryRendering.value || historyMarkdownVisible.value
);
const historyMessagesLoaded = computed(
  () => workspaceState.value.historyMessagesLoaded
);
const historyRenderKey = computed(
  () => workspaceState.value.historyRenderKey || ""
);
const messageRenderPolicy = computed(
  () => workspaceState.value.messageRenderPolicy || null
);
const isHistoryBusy = computed(() => resolveBooleanSource(isHistoryRendering));
const chatPageLock = {
  isScrollButtonBlocked: computed(() => isHistoryBusy.value),
};

const {scheduleComposerHeightUpdate} = useConversationComposerHeight(
  composerSlotRef,
  isHistoryRendering,
  [
    readonly,
    mode,
    showScrollBottom,
    isActiveModelUnavailable,
    isGenerating,
    isHistoryRendering,
    computed(() => messages.value.length),
  ]
);
function scrollBottom() {
  if (chatPageLock.isScrollButtonBlocked.value) return;
  chatWorkspaceActions.scrollBottom?.();
}


function handlePromptExpandedChange(expanded) {
  isPromptExpandedInChat.value = Boolean(expanded);
  scheduleComposerHeightUpdate();
}

function collapsePromptExpandedForChatSwitch() {
  promptComposerRef.value?.collapsePromptExpanded?.();
  if (isPromptExpandedInChat.value) {
    isPromptExpandedInChat.value = false;
  }
  scheduleComposerHeightUpdate();
}


function handleMessageContentRendered() {
  if (!isHistoryRendering.value) {
    parentMessageActions.messageContentRendered?.();
  }
  scheduleComposerHeightUpdate();
}

function handleHistoryRendered() {
  parentMessageActions.historyRendered?.();
  scheduleComposerHeightUpdate();
}

function handlePromptHeightChange() {
  scheduleComposerHeightUpdate();
}

provideMessageActions({
  ...parentMessageActions,
  messageContentRendered: handleMessageContentRendered,
  historyRendered: handleHistoryRendered,
});

providePromptWorkspaceLayoutActions({
  onExpandedChange: handlePromptExpandedChange,
  onHeightChange: handlePromptHeightChange,
});

watch(activeChatId, () => {
  collapsePromptExpandedForChatSwitch();
});

defineExpose({
  listRef,
});
</script>

<style scoped lang="scss">
/* 기존 대화방 composer 모바일 보정은 대화방 workspace가 소유합니다. */
:global(body.mobile-mode) .mobile-chat-prompt {
  width: 100%;
  max-width: none;
}

:global(body.mobile-mode) .mobile-chat-prompt :deep(.prompt-box--gemini) {
  align-items: stretch;
}

:global(body.mobile-mode) .mobile-chat-prompt :deep(.prompt-action-row) {
  display: flex;
  width: 100%;
  min-width: 0;
  align-self: stretch;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

:global(body.mobile-mode) .mobile-chat-prompt :deep(.prompt-left-actions) {
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
:global(body.mobile-mode) .mobile-chat-prompt :deep(.voice-button) {
  flex: 0 0 auto;
}
</style>
