<template>
  <ChatHeader
    :mode="mode"
    :assistant-label="assistantLabel"
    :assistant="assistant"
    :conversation-title="conversationTitle"
    :theme-name="themeName"
  />

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

<script setup>
/**
 * @file components/workspace/ChatConversationWorkspace.vue
 * @description 기존 통합 채팅 workspace의 대화방 렌더링만 분리한 라우트 전용 workspace입니다.
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
import ChatHeader from "@/components/chat/ChatHeader.vue";
import ChatReadonlyInput from "@/components/chat/ChatReadonlyInput.vue";
import MessageList from "@/components/chat/MessageList.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import {
  CHAT_WORKSPACE_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatActionContext";
import {useInteractionGuard} from "@/composables/runtime/useInteractionGuard";

const {t} = useI18n();
const listRef = ref(null);
const composerSlotRef = ref(null);
let composerResizeObserver = null;
let composerHeightTimerIds = [];
let composerHeightRafId = 0;

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

function updateComposerHeight() {
  const height = composerSlotRef.value?.offsetHeight || 0;
  document.documentElement.style.setProperty(
    "--chat-composer-height",
    `${Math.max(height, 72)}px`
  );
}

function clearComposerHeightSchedule() {
  composerHeightTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  composerHeightTimerIds = [];
  if (composerHeightRafId) {
    window.cancelAnimationFrame(composerHeightRafId);
    composerHeightRafId = 0;
  }
}

function scheduleComposerHeightUpdate() {
  if (typeof window === "undefined") {
    updateComposerHeight();
    return;
  }

  // 긴 대화방에서 창 크기 변경 시 composer ResizeObserver와 watch가 동시에
  // 연쇄 실행되면 reflow가 누적됩니다. 마지막 프레임 근처에서만 높이를
  // 갱신하고, streaming/hydration 상태 변화는 짧은 보정 타이머로 유지합니다.
  clearComposerHeightSchedule();
  composerHeightRafId = window.requestAnimationFrame(() => {
    composerHeightRafId = 0;
    updateComposerHeight();
  });
  composerHeightTimerIds = [80, 160].map((delay) =>
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
    composerResizeObserver = new ResizeObserver(scheduleComposerHeightUpdate);
    composerResizeObserver.observe(composerSlotRef.value);
  }
}

function cleanupComposerHeightObserver() {
  clearComposerHeightSchedule();
  composerResizeObserver?.disconnect();
  composerResizeObserver = null;
}

onMounted(async () => {
  await nextTick();
  observeComposerHeight();
});

onBeforeUnmount(cleanupComposerHeightObserver);

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
  margin-left: auto;
}
</style>
