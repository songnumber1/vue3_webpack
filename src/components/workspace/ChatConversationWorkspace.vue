<template>
  <section class="conversation-workspace">
    <ChatHeader
      :assistant-label="assistantLabel"
      :assistant="assistant"
      :show-studio-detail-button="showStudioDetailButton"
      :studio-detail-disabled="studioDetailDisabled"
    />

    <ChatHistory ref="chatHistoryRef" />
    <button
      v-if="showScrollBottom"
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
  </section>
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
import {createId} from "@/utils/id";
import {SHARED_ROUTE_NAMES} from "@/constants/routeNames";

const {t} = useI18n();
const route = useRoute();
const composerSlotRef = ref(null);
const promptComposerRef = ref(null);
const chatHistoryRef = ref(null);

const chatStore = useChatStore();
const selectedChatInfo = computed(() =>
  chatStore.selectedChatInfo || chatStore.getHistory(chatStore.selectedChatId)
);
const selectedAssistInfo = computed(() =>
  chatStore.selectedAssistInfo || chatStore.currentAssistant
);
const selectedModelInfo = computed(() =>
  chatStore.selectedModelInfo || chatStore.currentModel
);
const isSharedRoute = computed(() => SHARED_ROUTE_NAMES.includes(route.name));
const readonly = computed(
  () =>
    isSharedRoute.value ||
    chatStore.isSharedChat ||
    chatStore.isActiveSharedRoom ||
    selectedChatInfo.value?.roomType === "shared" ||
    Boolean(selectedChatInfo.value?.sharedId || selectedChatInfo.value?.ShardId)
);
const assistant = computed(() => selectedAssistInfo.value);
const assistantLabel = computed(
  () =>
    selectedChatInfo.value?.assistantName ||
    selectedChatInfo.value?.assistName ||
    assistant.value?.name ||
    assistant.value?.title ||
    t("chat.assistant")
);
const showStudioDetailButton = computed(() =>
  Boolean(
    assistant.value?.studio ||
      assistant.value?.studioYN === "Y" ||
      assistant.value?.assistantType === "studio"
  )
);
const studioDetailDisabled = computed(
  () => isGenerating.value || isActiveModelUnavailable.value
);
const isActiveModelDeleted = computed(() =>
  Boolean(
    selectedModelInfo.value?.deleted ||
      selectedModelInfo.value?.isDeleted ||
      selectedModelInfo.value?.delYN === "Y" ||
      selectedChatInfo.value?.isModelDeleted
  )
);
const isActiveModelUnavailable = computed(() =>
  Boolean(
    selectedModelInfo.value?.unavailable ||
      selectedModelInfo.value?.isUnavailable ||
      selectedChatInfo.value?.isModelUnavailable
  )
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
  chatHistoryRef.value?.scrollDown?.({force: true});
}

function handlePromptExpandedChange() {
  scheduleComposerHeightUpdate();
}

function collapsePromptExpandedForChatSwitch() {
  promptComposerRef.value?.collapsePromptExpanded?.();
  scheduleComposerHeightUpdate();
}

function submitPromptFromWorkspace(payload = {}) {
  if (readonly.value || isActiveModelUnavailable.value || isGenerating.value) return;
  if (!chatStore.selectedChatId) return;
  if (!payload?.text && !payload?.attachments?.length) return;

  chatStore.setSelectedChatSearchInfo(null);
  chatStore.initSelectChatInfo(payload.text, chatStore.selectedChatId, createId());
}
function handleSelectedModelUpdate(value) {
  chatStore.selectModel(value);
}


watch(
  isSharedRoute,
  (value) => {
    chatStore.setIsSharedChat(value);
  },
  {immediate: true}
);

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
.conversation-workspace {
  position: relative;
  grid-row: 1 / -1;
  align-self: stretch;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.conversation-workspace :deep(.message-list-shell) {
  min-height: 0;
  overflow: hidden;
}

.conversation-workspace :deep(.message-list) {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* 기존 대화방 composer 모바일 보정은 대화방 workspace가 소유합니다. */
:global(body.mobile-mode) .mobile-chat-prompt {
  width: 100%;
  max-width: none;
}

:global(body.mobile-mode) .mobile-chat-prompt,
:global(body.mobile-mode) .mobile-chat-prompt.prompt-wrap {
  background: transparent;
  box-shadow: none;
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
