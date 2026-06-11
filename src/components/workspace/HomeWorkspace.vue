<template>
  <ChatHeader
    v-if="isMobile"
    mode="main"
    :assistant-label="assistantLabel"
    :assistant="assistant"
    :conversation-title="conversationTitle"
    :theme-name="themeName"
  />

  <MainEmptyState
    :is-mobile="isMobile"
    :assistant-icon="mainAssistantIcon"
    :assistant-label="assistantLabel"
    :suggestions="suggestions"
    :show-studio-detail-button="showStudioDetailButton"
    :studio-detail-disabled="studioDetailDisabled"
    @suggestion-click="handleSuggestionClick"
    @studio-detail="workspaceActions.openStudioDetail?.()"
  >
    <template #composer>
      <PromptComposer ref="mainPromptInputRef" :class="mainPromptClass" />
    </template>
  </MainEmptyState>
</template>

<script setup>
/**
 * @file components/workspace/HomeWorkspace.vue
 * @description 실제 메인 라우트 전용 workspace입니다. 메인 빈 화면 UI는 MainEmptyState를 공유하고,
 * 실제 PromptComposer만 slot으로 주입하여 Studio 미리보기와 UI를 함께 관리합니다.
 */
import {computed, ref} from "vue";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import MainEmptyState from "@/components/workspace/MainEmptyState.vue";
import {
  useChatWorkspaceStateContext,
  useWorkspaceActionsContext,
} from "@/composables/chat/context/useChatInject";
import {getAssistantImageBySize} from "@/constants/assistantImages";
import {isStudioAssistant} from "@/composables/studio/useStudioDetailModel";
import {useResolvedMobileMode} from "@/composables/runtime/useResolvedMobileMode";
import {useMainPageActions} from "@/composables/main/useMainPageActions";
import {useMainPageLock} from "@/composables/main/useMainPageLock";
import {useMainPromptState} from "@/composables/main/useMainPromptState";

const mainPromptInputRef = ref(null);
const workspaceState = useChatWorkspaceStateContext();
const workspaceActions = useWorkspaceActionsContext();
const injectedIsMobile = computed(() => workspaceState.value.isMobile);
const isMobile = useResolvedMobileMode(injectedIsMobile);
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
const mainPageLock = useMainPageLock();
const {mainPromptClass} = useMainPromptState({isMobile});
const mainPageActions = useMainPageActions({
  promptInputRef: mainPromptInputRef,
  lock: mainPageLock,
});

function handleSuggestionClick(item) {
  mainPageActions.applySuggestionToPrompt(item);
}
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
