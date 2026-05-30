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
    @suggestion-click="handleSuggestionClick"
  >
    <template #composer>
      <PromptComposer ref="mainPromptInputRef" :class="mainPromptClass" />
    </template>
  </MainEmptyState>
</template>

<script setup>
/**
 * @file components/workspace/MainWorkspace.vue
 * @description 실제 메인 라우트 전용 workspace입니다. 메인 빈 화면 UI는 MainEmptyState를 공유하고,
 * 실제 PromptComposer만 slot으로 주입하여 Studio 미리보기와 UI를 함께 관리합니다.
 */
import {computed, inject, ref} from "vue";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import MainEmptyState from "@/components/workspace/MainEmptyState.vue";
import {
  CHAT_WORKSPACE_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatActionContext";
import {getAssistantImageBySize} from "@/constants/assistantImages";
import {useInteractionGuard} from "@/composables/runtime/useInteractionGuard";

const mainPromptInputRef = ref(null);
const workspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
inject(WORKSPACE_ACTIONS_KEY, createEmptyWorkspaceActions());
const {isInteractionBlocked} = useInteractionGuard();

const isMobile = computed(() => workspaceState.value.isMobile);
const assistantLabel = computed(() => workspaceState.value.assistantLabel);
const assistant = computed(() => workspaceState.value.assistant);
const conversationTitle = computed(
  () => workspaceState.value.conversationTitle
);
const themeName = computed(() => workspaceState.value.themeName);
const suggestions = computed(() => workspaceState.value.suggestions || []);
const mainAssistantIcon = computed(() =>
  getAssistantImageBySize(assistant.value, 48)
);
const mainPromptClass = computed(() =>
  isMobile.value ? "mobile-main-fixed-prompt" : "desktop-center-prompt"
);

function handleSuggestionClick(item) {
  if (isInteractionBlocked.value) return;
  const prompt = item?.prompt || item?.title || item?.text || "";
  mainPromptInputRef.value?.setText(prompt, {focus: true});
}
</script>
