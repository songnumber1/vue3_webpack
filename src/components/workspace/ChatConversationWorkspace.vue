<template>
  <ChatHeader
    :assistant-label="assistantLabel"
    :assistant="assistant"
    :show-studio-detail-button="showStudioDetailButton"
    :studio-detail-disabled="studioDetailDisabled"
  />

  <ChatHistory
    ref="listRef"
    :visible="!isPromptExpandedInChat"
    @content-rendered="handleMessageContentRendered"
    @history-rendered="handleHistoryRendered"
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
      @submit="submitPromptFromWorkspace"
      @update-selected-model="handleSelectedModelUpdate"
      @focus="scheduleComposerHeightUpdate"
      @height-change="scheduleComposerHeightUpdate"
      @expanded-change="handlePromptExpandedChange"
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
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import {useI18n} from "vue-i18n";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import ChatReadonlyInput from "@/components/chat/ChatReadonlyInput.vue";
import ChatHistory from "@/components/chat/ChatHistory.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import {useChatStore} from "@/stores/chatStore";
import {resolveWorkspaceAssistantLabel} from "@/composables/chat/internal/policy/chatHeaderPolicy";
import {isStudioAssistant} from "@/composables/studio/useStudioDetailModel";
import {resolveBooleanSource} from "@/utils/interactionGuard";

const {t} = useI18n();
const listRef = ref(null);
const composerSlotRef = ref(null);
const promptComposerRef = ref(null);
const isPromptExpandedInChat = ref(false);

const chatStore = useChatStore();
const activeChatId = computed(() => chatStore.selectedChatId || "");
const readonly = computed(() => chatStore.isActiveSharedRoom);
const assistant = computed(() => chatStore.currentAssistant);
const assistantLabel = computed(() =>
  resolveWorkspaceAssistantLabel(
    chatStore.activeSession,
    assistant.value,
    t("chat.assistant")
  )
);
const showStudioDetailButton = computed(() =>
  isStudioAssistant(assistant.value)
);
const studioDetailDisabled = computed(
  () =>
    isGenerating.value ||
    isHistoryRendering.value ||
    isActiveModelUnavailable.value
);
const isActiveModelDeleted = computed(() =>
  Boolean(chatStore.activeSession?.isModelDeleted)
);
const isActiveModelUnavailable = computed(() =>
  Boolean(chatStore.activeSession?.isModelUnavailable)
);
const readonlyInputVariant = computed(() => {
  if (readonly.value) return "shared";
  return isActiveModelDeleted.value ? "deleted-model" : "unavailable-model";
});
const isGenerating = computed(() => chatStore.isWait);
const messages = computed(() => chatStore.activeMessages || []);
const showScrollBottom = computed(() => chatStore.showScrollBottom);
const isHistoryRendering = computed(() => chatStore.isHistoryRendering);
const historyMarkdownVisible = computed(() => chatStore.historyMarkdownVisible);
const isComposerVisible = computed(
  () => !isHistoryRendering.value || historyMarkdownVisible.value
);
const isHistoryBusy = computed(() => resolveBooleanSource(isHistoryRendering));
const chatPageLock = {
  isScrollButtonBlocked: computed(() => isHistoryBusy.value),
};

let composerResizeObserver = null;
let composerHeightTimerIds = [];
let composerHeightRafId = 0;
const composerHeightWatchSources = [
  readonly,
  showScrollBottom,
  isActiveModelUnavailable,
  isGenerating,
  isHistoryRendering,
  computed(() => messages.value.length),
];

function updateComposerHeight() {
  if (typeof document === "undefined") return;

  const height = composerSlotRef.value?.offsetHeight || 0;
  document.documentElement.style.setProperty(
    "--chat-composer-height",
    `${Math.max(height, 72)}px`
  );
}

function clearComposerHeightSchedule() {
  if (typeof window !== "undefined") {
    composerHeightTimerIds.forEach((timerId) => window.clearTimeout(timerId));
    if (composerHeightRafId) {
      window.cancelAnimationFrame(composerHeightRafId);
    }
  }

  composerHeightTimerIds = [];
  composerHeightRafId = 0;
}

function scheduleComposerHeightUpdate() {
  if (typeof window === "undefined") {
    updateComposerHeight();
    return;
  }

  clearComposerHeightSchedule();
  composerHeightRafId = window.requestAnimationFrame(() => {
    composerHeightRafId = 0;
    updateComposerHeight();
  });

  if (isHistoryRendering.value) return;

  composerHeightTimerIds = [80, 160].map((delay) =>
    window.setTimeout(updateComposerHeight, delay)
  );
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
  composerResizeObserver?.disconnect?.();
  composerResizeObserver = null;
}
function scrollBottom() {
  if (chatPageLock.isScrollButtonBlocked.value) return;
  listRef.value?.scrollToBottom?.({force: true, behavior: "smooth", stable: true});
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
  scheduleComposerHeightUpdate();
}

function handleHistoryRendered() {
  scheduleComposerHeightUpdate();
}


function submitPromptFromWorkspace(payload) {
  listRef.value?.submit?.(payload);
}

function handleSelectedModelUpdate(value) {
  chatStore.selectModel(value);
}



watch(activeChatId, () => {
  collapsePromptExpandedForChatSwitch();
});

watch(
  () => composerHeightWatchSources.map((source) => source?.value),
  async () => {
    await nextTick();
    scheduleComposerHeightUpdate();
  }
);

onMounted(async () => {
  await nextTick();
  observeComposerHeight();
});

onBeforeUnmount(() => {
  cleanupComposerHeightObserver();
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
