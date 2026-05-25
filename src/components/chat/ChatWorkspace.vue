<template>
  <ChatHeader
    :mode="mode"
    :is-mobile="isMobile"
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
      <ChatPromptInput
        ref="mainPromptInputRef"
        :is-mobile="isMobile"
        :class="mainPromptClass"
        :floating="false"
        :selected-model="selectedModel"
        :models="models"
        :disabled="false"
        :generating="isGenerating"
        :model-readonly="modelReadonly"
        :show-help="false"
      />
    </div>
  </section>

  <template v-else>
    <MessageList
      ref="listRef"
      :messages="messages"
      :loading="isGenerating"
      :auto-scroll-on-answer="autoScrollOnAnswer"
      @content-rendered="workspaceActions.handleMessageContentRendered()"
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
      <ChatPromptInput
        v-else
        :class="{'mobile-chat-prompt': isMobile}"
        :is-mobile="isMobile"
        :selected-model="selectedModel"
        :models="models"
        :disabled="false"
        :generating="isGenerating"
        :model-readonly="modelReadonly"
        :show-help="false"
      />
    </div>
  </template>
</template>

<script setup>
/**
 * @file components/chat/ChatWorkspace.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
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
import ChatPromptInput from "./ChatPromptInput.vue";
import {
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions,
} from "@/composables/chat/chatActionContext";
import {getAssistantImageBySize} from "@/constants/assistantImages";
import {useInteractionGuard} from "@/composables/runtime/useInteractionGuard";

/**
 * [Main/Chat 화면 분기 Root]
 * MainPage와 ChatPage가 같은 ChatContainer를 사용해도 화면이 달라지는 이유는 route 기반 mode가 이 컴포넌트까지 내려오기 때문입니다.
 * mode가 main이면 시작 화면/추천 질문/메인 prompt를 표시하고, chat이면 MessageList와 하단 composer slot을 표시합니다.
 */

const {t} = useI18n();
const listRef = ref(null);
const composerSlotRef = ref(null);
const mainPromptInputRef = ref(null);
let composerResizeObserver = null;

const workspaceActions = inject(
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions()
);
const {isInteractionBlocked} = useInteractionGuard();

/**
 * 현재 상태를 기준으로 reactive 값 또는 DOM 보조 값을 갱신합니다.
 */
function updateComposerHeight() {
  const height = composerSlotRef.value?.offsetHeight || 0;
  document.documentElement.style.setProperty(
    "--chat-composer-height",
    `${Math.max(height, 72)}px`
  );
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function observeComposerHeight() {
  if (!composerSlotRef.value) return;
  updateComposerHeight();
  if (typeof ResizeObserver !== "undefined") {
    composerResizeObserver = new ResizeObserver(updateComposerHeight);
    composerResizeObserver.observe(composerSlotRef.value);
  }
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function cleanupComposerHeightObserver() {
  composerResizeObserver?.disconnect();
  composerResizeObserver = null;
}

onMounted(async () => {
  await nextTick();
  observeComposerHeight();
});

onBeforeUnmount(cleanupComposerHeightObserver);

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  mode: {type: String, default: "main"},
  readonly: {type: Boolean, default: false},
  isMobile: {type: Boolean, default: false},
  assistantLabel: {type: String, default: "Assistant"},
  assistant: {type: Object, default: null},
  conversationTitle: {type: String, default: ""},
  themeName: {type: String, default: "light"},
  suggestions: {type: Array, default: () => []},
  selectedModel: {type: String, default: ""},
  models: {type: Array, default: () => []},
  modelReadonly: {type: Boolean, default: false},
  isActiveModelDeleted: {type: Boolean, default: false},
  isActiveModelUnavailable: {type: Boolean, default: false},
  isGenerating: {type: Boolean, default: false},
  messages: {type: Array, default: () => []},
  showScrollBottom: {type: Boolean, default: false},
  autoScrollOnAnswer: {type: Boolean, default: false},
});

const isMainPage = computed(() => props.mode === "main");

const mainAssistantIcon = computed(() =>
  getAssistantImageBySize(props.assistant, 48)
);

const mainPromptClass = computed(() =>
  props.isMobile ? "mobile-main-fixed-prompt" : "desktop-center-prompt"
);

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function handleSuggestionClick(item) {
  if (isInteractionBlocked.value) return;
  const prompt = item?.prompt || item?.title || item?.text || "";
  mainPromptInputRef.value?.setText(prompt, {focus: true});
}

watch(
  () => [
    props.readonly,
    props.mode,
    props.showScrollBottom,
    props.isActiveModelUnavailable,
  ],
  async () => {
    await nextTick();
    updateComposerHeight();
  }
);

defineExpose({
  listRef,
});
</script>

<style scoped>
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
