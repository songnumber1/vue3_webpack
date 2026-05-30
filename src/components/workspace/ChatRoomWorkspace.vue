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
 * @file components/workspace/ChatRoomWorkspace.vue
 * @description 기존 ChatWorkspace의 대화방 렌더링만 분리한 라우트 전용 workspace입니다.
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
