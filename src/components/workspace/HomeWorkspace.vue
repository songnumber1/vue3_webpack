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
    :composer-expanded="isMainPromptExpanded"
    @suggestion-click="handleSuggestionClick"
    @studio-detail="workspaceActions.openStudioDetail?.()"
  >
    <template #composer>
      <PromptComposer
        ref="mainPromptInputRef"
        :class="mainPromptClass"
        @expanded-change="handleMainPromptExpandedChange"
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
import {useResolvedMobileMode} from "@/composables/runtime/useResolvedMobileMode";
import {useMainPromptState} from "@/composables/main/useMainPromptState";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";
import {
  CHAT_WORKSPACE_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceState,
  createEmptyWorkspaceActions,
} from "@/composables/chat/chatActionContext";

const chatStreamStore = useChatStreamStore();
const {isGlobalLocked, isStreamingLocked, isChatHistoryLocked} =
  useNavigationLock();
const mainPromptInputRef = ref(null);
const isMainPromptExpanded = ref(false);
const workspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const workspaceActions = inject(
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions()
);
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
const isMainPageActionBlocked = computed(
  () =>
    isGlobalLocked.value ||
    isStreamingLocked.value ||
    chatStreamStore.isStreaming ||
    isChatHistoryLocked.value
);
const isPromptExampleBlocked = computed(() => isMainPageActionBlocked.value);
const {mainPromptClass} = useMainPromptState({isMobile});
function handleSuggestionClick(item) {
  if (isPromptExampleBlocked.value) return;

  const prompt = item?.prompt || item?.title || item?.text || "";
  mainPromptInputRef.value?.setText?.(prompt, {focus: true});
}

function handleMainPromptExpandedChange(expanded) {
  isMainPromptExpanded.value = Boolean(expanded);
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
