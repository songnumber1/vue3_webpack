<template>
  <ChatHeader
    :assistant-label="assistantLabel"
    :assistant="assistant"
    :show-studio-detail-button="showStudioDetailButton"
    :studio-detail-disabled="studioDetailDisabled"
  />

  <ChatHistory :visible="!isPromptExpandedInChat" />
  <button
    v-if="showScrollBottom && !isPromptExpandedInChat"
    class="scroll-bottom-button"
    type="button"
    :aria-label="t('chat.scrollBottom')"
    @click="scrollBottom"
  >
    ↓
  </button>
  <div ref="composerSlotRef" class="chat-composer-slot">
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
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import ChatReadonlyInput from "@/components/chat/ChatReadonlyInput.vue";
import ChatHistory from "@/components/chat/ChatHistory.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import {useChatStore} from "@/stores/chatStore";
import {resolveWorkspaceAssistantLabel} from "@/composables/chat/internal/policy/chatHeaderPolicy";
import {isStudioAssistant} from "@/composables/studio/useStudioDetailModel";
import {resolveRouteMode, ROUTE_MODES} from "@/constants/routeNames";
import {isSharedChat} from "@/composables/chat/internal/message-list/useMessageRenderPolicy";

const {t} = useI18n();
const composerSlotRef = ref(null);
const promptComposerRef = ref(null);
const isPromptExpandedInChat = ref(false);

const chatStore = useChatStore();
const route = useRoute();
const activeHistory = computed(() =>
  chatStore.getHistory(chatStore.selectedChatId)
);
const readonly = computed(
  () =>
    chatStore.isActiveSharedRoom ||
    resolveRouteMode(route.name) === ROUTE_MODES.SHARED ||
    isSharedChat(activeHistory.value) ||
    Boolean(chatStore.activeSession?.sharedId)
);
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
  () => isGenerating.value || isActiveModelUnavailable.value
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
const showScrollBottom = computed(() => chatStore.showScrollBottom);

let composerResizeObserver = null;
let composerHeightRafId = 0;
const composerHeightWatchSources = [
  readonly,
  showScrollBottom,
  isActiveModelUnavailable,
  isGenerating,
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
    if (composerHeightRafId) {
      window.cancelAnimationFrame(composerHeightRafId);
    }
  }

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
  chatStore.requestScrollToBottom();
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

function submitPromptFromWorkspace(payload) {
  chatStore.setInput(payload);
}
function handleSelectedModelUpdate(value) {
  chatStore.selectModel(value);
}

watch(
  () => chatStore.selectedChatId,
  () => {
    collapsePromptExpandedForChatSwitch();
  }
);

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

defineExpose({});
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
