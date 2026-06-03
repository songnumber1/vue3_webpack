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

<style lang="scss">
/*
 * Studio create preview-specific overrides.
 * These rules were moved from studio/_preview-shared-main.scss so that
 * MainEmptyState and the Studio preview do not share mutable visual rules.
 * Keep these selectors scoped to .studio-create-page .studio-preview only.
 */
body.desktop-mode
  .studio-create-page
  .studio-preview
  .studio-preview__main-empty {
  flex: 1 1 auto;
  min-height: 0;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview
  .empty-center {
  gap: 14px;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview
  .empty-assistant-logo {
  width: 56px;
  height: 56px;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview
  .empty-center
  h1 {
  margin: 6px 0 0;
  font-size: 28px;
  line-height: 1.25;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview
  .suggestion-row--between {
  margin-top: 8px;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview
  .suggestion-chip {
  pointer-events: none;
}
</style>
