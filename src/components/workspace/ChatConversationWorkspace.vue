<template>
  <ChatHeader
    :mode="mode"
    :assistant-label="assistantLabel"
    :assistant="assistant"
    :conversation-title="conversationTitle"
    :theme-name="themeName"
    :show-studio-detail-button="showStudioDetailButton"
    :studio-detail-disabled="studioDetailDisabled"
    @studio-detail="workspaceActions.openStudioDetail?.()"
  />

  <MessageList
    v-show="!isPromptExpandedInChat"
    ref="listRef"
    :messages="messages"
    :loading="isGenerating"
    :auto-scroll-on-answer="autoScrollOnAnswer"
    :history-rendering="isHistoryRendering"
    :history-markdown-visible="historyMarkdownVisible"
    :history-messages-ready="historyMessagesLoaded"
    :has-previous-history-messages="hasPreviousHistoryMessages"
    :history-lazy-top-threshold="historyLazyTopThreshold"
    :history-lazy-chunk-size="historyLazyChunkSize"
    :message-render-policy="messageRenderPolicy"
    :pc-history-lazy-initial-count="pcHistoryLazyInitialCount"
    :pc-history-lazy-append-count="pcHistoryLazyAppendCount"
    :pc-history-lazy-top-threshold-px="pcHistoryLazyTopThresholdPx"
    :mobile-history-lazy-initial-count="mobileHistoryLazyInitialCount"
    :mobile-history-lazy-append-count="mobileHistoryLazyAppendCount"
    :readonly="readonly"
    @content-rendered="handleMessageContentRendered"
    @history-markdown-rendered="handleHistoryMarkdownRendered"
    @history-rendered="handleHistoryRendered"
    @load-previous-history="handleLoadPreviousHistory"
    @regenerate="handleRegenerate"
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
    @click="conversationActions.scrollBottom()"
  >
    ↓
  </button>
  <div
    v-show="isComposerVisible"
    ref="composerSlotRef"
    class="chat-composer-slot"
    :aria-hidden="isComposerVisible ? null : 'true'"
  >
    <ChatReadonlyInput v-if="readonly" />
    <ChatReadonlyInput
      v-else-if="isActiveModelUnavailable"
      :variant="isActiveModelDeleted ? 'deleted-model' : 'unavailable-model'"
    />
    <PromptComposer
      v-else
      ref="promptComposerRef"
      :class="{
        'mobile-chat-prompt': isMobile,
        'mobile-keyboard-dock': isMobile,
      }"
      @expanded-change="handlePromptExpandedChange"
    />
  </div>

  <aside
    v-if="showCodeInterpreterPanel"
    class="code-interpreter-preview-panel"
    :aria-label="t('chat.codeInterpreter.panelTitle')"
  >
    <div class="code-interpreter-preview-panel__header">
      <div>
        <span class="code-interpreter-preview-panel__eyebrow">
          {{ t("chat.codeInterpreter.eyebrow") }}
        </span>
        <strong>{{ t("chat.codeInterpreter.panelTitle") }}</strong>
      </div>
      <button
        class="code-interpreter-preview-panel__close"
        type="button"
        :aria-label="t('chat.codeInterpreter.close')"
        @click="closeCodeInterpreterPanel"
      >
        ×
      </button>
    </div>
    <div
      ref="previewRef"
      class="code-interpreter-preview-panel__body code-interpreter-markdown-body markdown-body"
      v-html="previewHtml"
    ></div>
  </aside>
</template>

<script setup>
/**
 * @file components/workspace/ChatConversationWorkspace.vue
 * @description 기존 통합 채팅 workspace의 대화방 렌더링만 분리한 라우트 전용 workspace입니다.
 */
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import ChatReadonlyInput from "@/components/chat/ChatReadonlyInput.vue";
import MessageList from "@/components/chat/MessageList.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import {
  useChatWorkspaceStateContext,
  useWorkspaceActionsContext,
} from "@/composables/chat/context/useChatInject";
import {useChatStore} from "@/stores/chatStore";
import {useChatPageLock} from "@/composables/chat/conversation/useChatPageLock";
import {useChatConversationActions} from "@/composables/chat/conversation/useChatConversationActions";
import {useCodeInterpreterPanel} from "@/composables/chat/conversation/useCodeInterpreterPanel";
import {useConversationComposerHeight} from "@/composables/chat/conversation/useConversationComposerHeight";
import {isStudioAssistant} from "@/composables/studio/useStudioDetailModel";

const {locale, t} = useI18n();
const listRef = ref(null);
const composerSlotRef = ref(null);
const promptComposerRef = ref(null);
const previewRef = ref(null);
const isPromptExpandedInChat = ref(false);

const workspaceState = useChatWorkspaceStateContext();
const workspaceActions = useWorkspaceActionsContext();
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
const isGenerating = computed(() => workspaceState.value.isGenerating);
const messages = computed(() => workspaceState.value.messages || []);
const showScrollBottom = computed(() => workspaceState.value.showScrollBottom);
const autoScrollOnAnswer = computed(
  () => workspaceState.value.autoScrollOnAnswer
);
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
const hasPreviousHistoryMessages = computed(
  () => workspaceState.value.hasPreviousHistoryMessages
);
const historyLazyTopThreshold = computed(
  () => workspaceState.value.historyLazyTopThreshold || 300
);
const historyLazyChunkSize = computed(
  () => workspaceState.value.historyLazyChunkSize || 50
);
const messageRenderPolicy = computed(
  () => workspaceState.value.messageRenderPolicy || null
);
const pcHistoryLazyInitialCount = computed(
  () => workspaceState.value.pcHistoryLazyInitialCount || 100
);
const pcHistoryLazyAppendCount = computed(
  () => workspaceState.value.pcHistoryLazyAppendCount || 50
);
const pcHistoryLazyTopThresholdPx = computed(
  () => workspaceState.value.pcHistoryLazyTopThresholdPx || 300
);
const mobileHistoryLazyInitialCount = computed(
  () => workspaceState.value.mobileHistoryLazyInitialCount || 50
);
const mobileHistoryLazyAppendCount = computed(
  () => workspaceState.value.mobileHistoryLazyAppendCount || 25
);
const chatPageLock = useChatPageLock({
  readonly,
  isGenerating,
  isHistoryRendering,
  isActiveModelUnavailable,
});
const conversationActions = useChatConversationActions({
  workspaceActions,
  lock: chatPageLock,
});
const {
  previewHtml,
  isDesktopRuntime,
  showCodeInterpreterPanel,
  closeCodeInterpreterPanel,
} = useCodeInterpreterPanel({
  locale,
  isMobile,
  mode,
  composerSlotRef,
  listRef,
  previewRef,
});

const {scheduleComposerHeightUpdate} = useConversationComposerHeight({
  composerSlotRef,
  isHistoryRendering,
  watchSources: [
    readonly,
    mode,
    showScrollBottom,
    isActiveModelUnavailable,
    isGenerating,
    isHistoryRendering,
    computed(() => messages.value.length),
    showCodeInterpreterPanel,
    isDesktopRuntime,
  ],
});
function handleRegenerate(message) {
  conversationActions.regenerate(message);
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
  if (isHistoryRendering.value) {
    return;
  }

  conversationActions.handleMessageContentRendered();
  scheduleComposerHeightUpdate();
}

function handleHistoryMarkdownRendered() {
  conversationActions.handleHistoryMarkdownRendered();
  scheduleComposerHeightUpdate();
}

function handleHistoryRendered() {
  conversationActions.handleHistoryRendered();
  scheduleComposerHeightUpdate();
}

function handleLoadPreviousHistory() {
  return conversationActions.loadPreviousHistoryMessages();
}

watch(activeChatId, () => {
  closeCodeInterpreterPanel();
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
