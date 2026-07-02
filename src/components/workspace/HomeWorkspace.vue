<template>
  <ChatHeader
    mode="main"
    :assistant-label="assistantLabel"
    :assistant="assistant"
    :conversation-title="conversationTitle"
    :theme-name="themeName"
  />

  <MainEmptyState
    :assistant-icon="mainAssistantIcon"
    :assistant-label="assistantLabel"
    :suggestions="suggestions"
    :show-studio-detail-button="showStudioDetailButton"
    :studio-detail-disabled="studioDetailDisabled"
    @suggestion-click="handleSuggestionClick"
  >
    <template #composer>
      <PromptComposer
        ref="mainPromptInputRef"
        :class="mainPromptClass"
      />
    </template>
  </MainEmptyState>
</template>

<script setup>
/**
 * @file components/workspace/HomeWorkspace.vue
 * @description 실제 메인 라우트 전용 workspace입니다. 메인 빈 화면 UI는 MainEmptyState를 공유하고,
 * 실제 PromptComposer만 slot으로 주입하여 Studio 미리보기와 UI를 함께 관리합니다.
 */
import {computed, ref, inject} from "vue";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import MainEmptyState from "@/components/workspace/MainEmptyState.vue";
import {getAssistantImageBySize} from "@/constants/assistantImages";
import {isStudioAssistant} from "@/composables/studio/useStudioDetailModel";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {providePromptWorkspaceLayoutActions} from "@/composables/prompt/context/promptWorkspaceLayoutContext";
import {
  CHAT_WORKSPACE_STATE_KEY,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatStateContext";

const chatStreamStore = useChatStreamStore();
const mainPromptInputRef = ref(null);
const isMainPromptExpanded = ref(false);

const workspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const assistantLabel = computed(() => workspaceState.value.assistantLabel);
const assistant = computed(() => workspaceState.value.assistant);
const conversationTitle = computed(
  () => workspaceState.value.conversationTitle
);
const themeName = computed(() => workspaceState.value.themeName);
const suggestions = computed(() => workspaceState.value.suggestions || []);
const showStudioDetailButton = computed(() =>
  isStudioAssistant(assistant.value)
);
const studioDetailDisabled = computed(
  () =>
    workspaceState.value.isGenerating || workspaceState.value.isHistoryRendering
);
const mainAssistantIcon = computed(() =>
  getAssistantImageBySize(assistant.value, 48)
);
const isMainPageActionBlocked = computed(() => chatStreamStore.isWait);
const isPromptExampleBlocked = computed(() => isMainPageActionBlocked.value);
const mainPromptClass = computed(
  () =>
    "mobile-keyboard-dock mobile-keyboard-dock--fixed mobile-main-fixed-prompt main-empty-state__prompt tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-prompt tw-box-border tw-w-[100dvw] tw-max-w-[100dvw] tw-overflow-hidden tw-bg-transparent tw-px-3 tw-pb-[max(12px,env(safe-area-inset-bottom))] tw-pt-2 tw-shadow-none"
);
function handleSuggestionClick(item) {
  if (isPromptExampleBlocked.value) return;

  const prompt = item?.prompt || item?.title || item?.text || "";
  mainPromptInputRef.value?.setText?.(prompt, {focus: true});
}

function handleMainPromptExpandedChange(expanded) {
  isMainPromptExpanded.value = Boolean(expanded);
}

providePromptWorkspaceLayoutActions({
  isExpanded: isMainPromptExpanded,
  onExpandedChange: handleMainPromptExpandedChange,
});
</script>

<style scoped lang="scss">
/* 기존 메인 composer 모바일 보정은 메인 workspace가 소유합니다. */
:global(body.mobile-mode) .mobile-main-fixed-prompt {
  width: 100%;
  max-width: none;
}

:global(body.mobile-mode) .mobile-main-fixed-prompt,
:global(body.mobile-mode) .mobile-main-fixed-prompt.prompt-wrap {
  background: transparent;
  box-shadow: none;
}

:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.prompt-box--gemini) {
  align-items: stretch;
}

:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.prompt-action-row) {
  display: flex;
  width: 100%;
  min-width: 0;
  align-self: stretch;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

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

:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.send-button),
:global(body.mobile-mode) .mobile-main-fixed-prompt :deep(.voice-button) {
  flex: 0 0 auto;
  margin-left: auto;
}
</style>
