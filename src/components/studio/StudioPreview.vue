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
          class="studio-preview-prompt desktop-center-prompt tw-w-full tw-border-0 tw-p-0"
          submit-disabled
          hide-tool-actions
          hide-attach-actions
          hide-voice-action
          @expanded-change="handlePreviewComposerExpandedChange"
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
  .studio-preview-prompt {
  order: 10 !important;
  width: min(100%, 520px) !important;
  max-width: 520px !important;
  margin: 0 auto;
  padding: 0 !important;
  border: 0 !important;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview
  .studio-preview-prompt
  .prompt-box {
  min-height: 122px;
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

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview
  .main-empty-state__suggestions {
  order: 20 !important;
  display: flex !important;
  grid-template-columns: none !important;
  flex-direction: column !important;
  flex-wrap: nowrap !important;
  align-items: stretch !important;
  justify-content: flex-start !important;
  width: min(100%, 520px) !important;
  max-width: 520px !important;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview
  .suggestion-chip {
  width: 100% !important;
  max-width: 100% !important;
  justify-content: flex-start !important;
  text-align: left !important;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview.main-empty-state--composer-expanded {
  align-items: stretch !important;
  justify-content: stretch !important;
  padding: 24px !important;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview.main-empty-state--composer-expanded
  .main-empty-state__center {
  width: min(100%, 520px) !important;
  max-width: 520px !important;
  height: 100% !important;
  min-height: 0 !important;
  flex: 1 1 auto !important;
  justify-content: stretch !important;
  align-items: stretch !important;
  gap: 0 !important;
  padding: 0 !important;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview.main-empty-state--composer-expanded
  .main-empty-state__logo,
body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview.main-empty-state--composer-expanded
  .main-empty-state__title,
body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview.main-empty-state--composer-expanded
  .main-empty-state__subtitle,
body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview.main-empty-state--composer-expanded
  .main-empty-state__suggestions {
  display: none !important;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview.main-empty-state--composer-expanded
  .studio-preview-prompt.prompt-wrap--expanded {
  display: flex !important;
  flex: 1 1 auto !important;
  width: min(100%, 520px) !important;
  max-width: 520px !important;
  height: 100% !important;
  min-height: 0 !important;
  margin: 0 auto !important;
}

body.desktop-mode
  .studio-create-page
  .studio-preview
  .main-empty-state--preview.main-empty-state--composer-expanded
  .studio-preview-prompt.prompt-wrap--expanded
  .prompt-box--expanded {
  width: 100% !important;
  height: 100% !important;
  max-height: 100% !important;
}
</style>
