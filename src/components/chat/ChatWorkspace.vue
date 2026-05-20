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
          :disabled="interactionBlocked"
          @click="workspaceActions.submit(item.prompt)"
        >
          <span v-if="item.icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="suggestion-chip-text">{{ item.text }}</span>
        </button>
      </div>
      <ChatPromptInput
        :is-mobile="isMobile"
        :class="mainPromptClass"
        :floating="false"
        :selected-model="selectedModel"
        :models="models"
        :disabled="isGenerating || interactionBlocked"
        :model-readonly="modelReadonly"
        :show-help="false"
        @update:selected-model="workspaceActions.updateSelectedModel($event)"
        @submit="workspaceActions.submit($event)"
        @focus="workspaceActions.handlePromptFocus()"
        @height-change="workspaceActions.handlePromptResize()"
      />
    </div>
  </section>

  <template v-else>
    <MessageList
      ref="listRef"
      :messages="messages"
      :loading="isGenerating"
      :interaction-blocked="interactionBlocked"
      @content-rendered="workspaceActions.handleMessageContentRendered()"
    />
    <button
      v-if="showScrollBottom && !interactionBlocked"
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
        :disabled="isGenerating || interactionBlocked"
        :model-readonly="modelReadonly"
        :show-help="false"
        @update:selected-model="workspaceActions.updateSelectedModel($event)"
        @submit="workspaceActions.submit($event)"
        @focus="workspaceActions.handlePromptFocus()"
        @height-change="workspaceActions.handlePromptResize()"
      />
    </div>
  </template>
</template>

<script setup>
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

const {t} = useI18n();
const listRef = ref(null);
const composerSlotRef = ref(null);
let composerResizeObserver = null;

const workspaceActions = inject(
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions()
);

function updateComposerHeight() {
  const height = composerSlotRef.value?.offsetHeight || 0;
  document.documentElement.style.setProperty(
    "--chat-composer-height",
    `${Math.max(height, 72)}px`
  );
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
  composerResizeObserver?.disconnect();
  composerResizeObserver = null;
}

onMounted(async () => {
  await nextTick();
  observeComposerHeight();
});

onBeforeUnmount(cleanupComposerHeightObserver);

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
  interactionBlocked: {type: Boolean, default: false},
  messages: {type: Array, default: () => []},
  showScrollBottom: {type: Boolean, default: false},
});

const isMainPage = computed(() => props.mode === "main");

const mainAssistantIcon = computed(() =>
  getAssistantImageBySize(props.assistant, 48)
);

const mainPromptClass = computed(() =>
  props.isMobile ? "mobile-main-fixed-prompt" : "desktop-center-prompt"
);

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
   component decides whether PromptInput is rendered as main, chat or shared. */
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
