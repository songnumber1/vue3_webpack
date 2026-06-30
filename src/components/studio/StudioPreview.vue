<template>
  <aside
    class="studio-preview tw-relative tw-min-h-0 tw-overflow-y-auto tw-border tw-border-solid tw-border-studio-border tw-rounded-studio tw-bg-studio-surface tw-p-4 tw-text-studio-text"
    :aria-label="t('studio.preview.label')"
  >
    <div
      class="studio-preview__label tw-absolute tw-left-4 tw-top-4 tw-shrink-0 tw-text-sm tw-font-extrabold tw-text-studio-muted"
    >
      {{ t("studio.preview.label") }}
    </div>
    <MainEmptyState
      preview
      class="studio-preview__main-empty tw-min-h-0"
      :assistant-icon="previewAssistantIcon"
      :assistant-label="resolvedAssistantLabel"
      :title="t('chat.startQuestion')"
      :subtitle="resolvedSubtitle"
      :suggestions="previewSuggestions"
      disable-interactions
      :composer-expanded="previewComposerExpanded"
    >
      <template #composer>
        <PromptComposer
          class="studio-preview-prompt tw-w-full tw-border-0 tw-p-0"
          submit-disabled
          hide-tool-actions
          hide-attach-actions
          hide-voice-action
        />
      </template>
    </MainEmptyState>
  </aside>
</template>

<script setup>
/**
 * @file components/studio/StudioPreview.vue
 * @description Studio 만들기 미리보기입니다. 메인 화면과 동일한 MainEmptyState를 재사용하되,
 * 기존 PromptComposer를 미리보기 전용 submit-disabled 상태로 표시하여 입력 UI는 보여주되 전송/SSE 등 실제 채팅 질의를 차단합니다.
 */
import {computed, ref} from "vue";
import {providePromptWorkspaceLayoutActions} from "@/composables/prompt/context/promptWorkspaceLayoutContext";
import {useI18n} from "vue-i18n";
import MainEmptyState from "@/components/workspace/MainEmptyState.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import {DEFAULT_ASSISTANT_IMAGE} from "@/constants/assistantImages";

const {t} = useI18n();

const props = defineProps({
  initial: {type: String, default: "A"},
  name: {type: String, default: ""},
  description: {type: String, default: ""},
  prompts: {type: Array, default: () => []},
});

const resolvedAssistantLabel = computed(
  () => props.name || t("studio.preview.fallbackName")
);
const resolvedSubtitle = computed(
  () => props.description || t("studio.preview.fallbackDescription")
);
const previewAssistantIcon = computed(() => DEFAULT_ASSISTANT_IMAGE.Image48Src);

const previewComposerExpanded = ref(false);

function handlePreviewComposerExpandedChange(expanded) {
  previewComposerExpanded.value = Boolean(expanded);
}

providePromptWorkspaceLayoutActions({
  onExpandedChange: handlePreviewComposerExpandedChange,
});

const previewSuggestions = computed(() =>
  (props.prompts || [])
    .filter(Boolean)
    .slice(0, 5)
    .map((prompt, index) => ({
      id: `studio-preview-prompt-${index}`,
      text: prompt,
      title: prompt,
      prompt,
    }))
);
</script>
