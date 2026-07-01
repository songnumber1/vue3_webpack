<template>
  <ChatHeader
    :mode="mode"
    :assistant-label="assistantLabel"
    :assistant="assistant"
    :conversation-title="conversationTitle"
    :theme-name="themeName"
    :show-studio-detail-button="showStudioDetailButton"
    :studio-detail-disabled="studioDetailDisabled"
    @open-studio-detail="emit('open-studio-detail')"
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
      class="mobile-chat-prompt mobile-keyboard-dock"
    />
  </div>

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
import {useChatStore} from "@/stores/chatStore";
import {useConversationComposerHeight} from "@/composables/chat/conversation/useConversationComposerHeight";
import {isStudioAssistant} from "@/composables/studio/useStudioDetailModel";
import {resolveBooleanSource} from "@/utils/interactionGuard";
import {providePromptWorkspaceLayoutActions} from "@/composables/prompt/context/promptWorkspaceLayoutContext";
import {
  provideMessageActions,
  useMessageActions,
} from "@/composables/chat/context/messageActionContext";

const emit = defineEmits([
  "open-studio-detail",
  "scroll-bottom",
  "prompt-viewport-refresh",
]);

const {t} = useI18n();
const listRef = ref(null);
const composerSlotRef = ref(null);
const promptComposerRef = ref(null);
const isPromptExpandedInChat = ref(false);

const props = defineProps({
  mode: {type: String, default: "chat"},
  readonly: {type: Boolean, default: false},
  assistantLabel: {type: String, default: "Assistant"},
  assistant: {type: Object, default: null},
  conversationTitle: {type: String, default: ""},
  themeName: {type: String, default: "light"},
  isActiveModelDeleted: {type: Boolean, default: false},
  isActiveModelUnavailable: {type: Boolean, default: false},
  isGenerating: {type: Boolean, default: false},
  messages: {type: Array, default: () => []},
  showScrollBottom: {type: Boolean, default: false},
  isHistoryRendering: {type: Boolean, default: false},
  historyMarkdownVisible: {type: Boolean, default: false},
  historyMessagesLoaded: {type: Boolean, default: false},
  historyRenderKey: {type: String, default: ""},
  messageRenderPolicy: {type: Object, default: null},
});
const parentMessageActions = useMessageActions();
const chatStore = useChatStore();
const mode = computed(() => props.mode);
const activeChatId = computed(() => chatStore.selectedChatId || "");
const readonly = computed(() => props.readonly);
const assistantLabel = computed(() => props.assistantLabel);
const assistant = computed(() => props.assistant);
const conversationTitle = computed(() => props.conversationTitle);
const themeName = computed(() => props.themeName);
const showStudioDetailButton = computed(() =>
  isStudioAssistant(assistant.value)
);
const studioDetailDisabled = computed(
  () =>
    isGenerating.value || isHistoryRendering.value || isActiveModelUnavailable.value
);
const isActiveModelDeleted = computed(() => props.isActiveModelDeleted);
const isActiveModelUnavailable = computed(
  () => props.isActiveModelUnavailable
);
const readonlyInputVariant = computed(() => {
  if (readonly.value) return "shared";
  return isActiveModelDeleted.value ? "deleted-model" : "unavailable-model";
});
const isGenerating = computed(() => props.isGenerating);
const messages = computed(() => props.messages || []);
const showScrollBottom = computed(() => props.showScrollBottom);
const isHistoryRendering = computed(() => props.isHistoryRendering);
const historyMarkdownVisible = computed(() => props.historyMarkdownVisible);
const isComposerVisible = computed(
  () => !isHistoryRendering.value || historyMarkdownVisible.value
);
const historyMessagesLoaded = computed(() => props.historyMessagesLoaded);
const historyRenderKey = computed(() => props.historyRenderKey || "");
const messageRenderPolicy = computed(() => props.messageRenderPolicy || null);
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
  emit("scroll-bottom");
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

function handlePromptFocus() {
  emit("prompt-viewport-refresh");
}

function handlePromptHeightChange() {
  scheduleComposerHeightUpdate();
  emit("prompt-viewport-refresh");
}

provideMessageActions({
  ...parentMessageActions,
  messageContentRendered: handleMessageContentRendered,
  historyRendered: handleHistoryRendered,
});

providePromptWorkspaceLayoutActions({
  onFocus: handlePromptFocus,
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
