<template>
  <aside class="studio-preview tw-min-h-0 tw-bg-studio-surface tw-text-studio-text" :aria-label="t('studio.preview.label')">
    <div class="studio-preview__label tw-shrink-0 tw-text-studio-muted">{{ t("studio.preview.label") }}</div>
    <MainEmptyState
      preview
      class="studio-preview__main-empty tw-min-h-0"
      :assistant-icon="previewAssistantIcon"
      :assistant-label="resolvedAssistantLabel"
      :title="t('chat.startQuestion')"
      :subtitle="resolvedSubtitle"
      :suggestions="previewSuggestions"
      disable-interactions
    />
  </aside>
</template>

<script setup>
/**
 * @file components/studio/StudioPreview.vue
 * @description Studio 만들기 미리보기입니다. 메인 화면과 동일한 MainEmptyState를 재사용하되,
 * 입력 영역은 표시하지 않고, 실제 PromptComposer도 연결하지 않아 전송/SSE/첨부 등 실제 기능 사이드 이펙트를 차단합니다.
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import MainEmptyState from "@/components/workspace/MainEmptyState.vue";
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
