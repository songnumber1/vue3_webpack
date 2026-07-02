<template>
  <ChatHeader
    :assistant-label="assistantLabel"
    :assistant="assistant"
  />

  <MainEmptyState
    :assistant-icon="mainAssistantIcon"
    :assistant-label="assistantLabel"
    :suggestions="suggestions"
    :show-studio-detail-button="showStudioDetailButton"
    :studio-detail-disabled="studioDetailDisabled"
    :is-composer-expanded="isMainPromptExpanded"
    @suggestion-click="handleSuggestionClick"
  >
    <template #composer>
      <PromptComposer
        ref="mainPromptInputRef"
        :class="mainPromptClass"
        @submit="emit('prompt-submit', $event)"
        @update-selected-model="emit('update-selected-model', $event)"
        @focus="emit('prompt-focus', $event)"
        @height-change="emit('prompt-height-change', $event)"
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
import {computed, ref} from "vue";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import MainEmptyState from "@/components/workspace/MainEmptyState.vue";
import {getAssistantImageBySize} from "@/constants/assistantImages";
import {isStudioAssistant} from "@/composables/studio/useStudioDetailModel";
import {useChatStore} from "@/stores/chatStore";
import {useI18n} from "vue-i18n";
import {resolveWorkspaceAssistantLabel} from "@/composables/chat/internal/policy/chatHeaderPolicy";
import {PROMPT_SUGGESTION_LIMIT} from "@/constants/promptSuggestions";

const emit = defineEmits(["prompt-submit", "update-selected-model", "prompt-focus", "prompt-height-change"]);

const chatStore = useChatStore();
const {t, locale} = useI18n();
const mainPromptInputRef = ref(null);
const isMainPromptExpanded = ref(false);

const assistant = computed(() => chatStore.currentAssistant);
const assistantLabel = computed(() =>
  resolveWorkspaceAssistantLabel(
    chatStore.activeSession,
    assistant.value,
    t("chat.assistant")
  )
);
const suggestions = computed(() => {
  const prompts =
    chatStore.examplePromptMap[chatStore.selectedAssistantId] || [];
  const isEnglish = locale.value === "en";

  return prompts
    .slice(0, PROMPT_SUGGESTION_LIMIT)
    .map((prompt) => {
      const localizedTitle = isEnglish
        ? prompt.titleEn || prompt.titleKo
        : prompt.titleKo || prompt.titleEn;
      const localizedContent = isEnglish
        ? prompt.contentEn || prompt.contentKo || localizedTitle
        : prompt.contentKo || prompt.contentEn || localizedTitle;
      const text = localizedTitle || localizedContent;
      const content = localizedContent || localizedTitle;
      return {
        id: prompt.id,
        text,
        title: content || text,
        prompt: content || text,
      };
    })
    .filter((item) => item.text && item.prompt);
});
const showStudioDetailButton = computed(() =>
  isStudioAssistant(assistant.value)
);
const studioDetailDisabled = computed(
  () =>
    chatStore.isWait || chatStore.isHistoryRendering
);
const mainAssistantIcon = computed(() =>
  getAssistantImageBySize(assistant.value, 48)
);
const isMainPageActionBlocked = computed(() => chatStore.isWait);
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
