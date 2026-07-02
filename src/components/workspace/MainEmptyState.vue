<template>
  <section
    class="empty-stage empty-stage--main main-empty-state tw-flex tw-h-full tw-min-h-0 tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-app-chat tw-px-6 tw-py-8"
    :class="{
      'empty-stage--mobile-main': true,
      'main-empty-state--preview': preview,
      'main-empty-state--composer-expanded': isComposerExpanded,
    }"
    style="display: flex"
  >
    <div
      class="empty-center main-empty-state__center tw-mx-auto tw-flex tw-w-full tw-max-w-[var(--layout-prompt-width,880px)] tw-flex-col tw-items-center tw-gap-4 tw-text-center"
    >
      <img
        class="empty-assistant-logo main-empty-state__logo tw-h-12 tw-w-12 tw-rounded-2xl tw-object-contain tw-shadow-control"
        :src="assistantIcon"
        :alt="assistantLabel"
      />
      <h1 class="main-empty-state__title">
        <span>{{ resolvedTitle }}</span>
        <button
          v-if="showStudioDetailButton"
          class="studio-detail-trigger main-empty-state__studio-detail"
          type="button"
          :disabled="studioDetailDisabled"
          aria-label="Studio 상세 보기"
          title="Studio 상세 보기"
          @click.stop="handleStudioDetailClick"
        >
          ⓘ
        </button>
      </h1>
      <p
        v-if="subtitle"
        class="main-empty-state__subtitle tw-mx-auto tw-max-w-[420px] tw-text-sm tw-leading-6 tw-text-app-subtle"
      >
        {{ subtitle }}
      </p>
      <div class="main-empty-state__composer-dock" aria-label="Main prompt">
        <slot name="composer"></slot>
      </div>
      <div
        v-if="normalizedSuggestions.length"
        class="suggestion-row suggestion-row--between main-empty-state__suggestions tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-2"
      >
        <button
          v-for="item in normalizedSuggestions"
          :key="item.id || item.text"
          class="suggestion-chip tw-inline-flex tw-max-w-full tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-app-controlBorder tw-bg-app-control tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-app-text tw-shadow-control tw-transition hover:tw-bg-app-controlHover"
          type="button"
          :title="item.title || item.prompt || item.text"
          :aria-disabled="disableInteractions ? 'true' : undefined"
          @click="handleSuggestionClick(item)"
        >
          <span v-if="item.icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="suggestion-chip-text">{{ item.text }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * @file components/workspace/MainEmptyState.vue
 * @description 메인 화면의 빈 상태 UI를 실제 메인 화면과 Studio 미리보기에서 함께 사용하는 공통 컴포넌트입니다.
 * 실제 입력/전송 기능은 slot으로만 주입하여 Studio 미리보기에서 채팅 요청이 발생하지 않도록 분리합니다.
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {DEFAULT_ASSISTANT_IMAGE} from "@/constants/assistantImages";
import {useStudioDetailActions} from "@/composables/studio/context/studioDetailActionContext";

const {t} = useI18n();

const studioDetailActions = useStudioDetailActions();
const props = defineProps({
  preview: {type: Boolean, default: false},
  disableInteractions: {type: Boolean, default: false},
  assistantIcon: {
    type: String,
    default: DEFAULT_ASSISTANT_IMAGE.Image48Src,
  },
  assistantLabel: {type: String, default: "Assistant"},
  title: {type: String, default: ""},
  subtitle: {type: String, default: ""},
  suggestions: {type: Array, default: () => []},
  showStudioDetailButton: {type: Boolean, default: false},
  studioDetailDisabled: {type: Boolean, default: false},
  isComposerExpanded: {type: Boolean, default: false},
});

const emit = defineEmits(["suggestion-click"]);

const resolvedTitle = computed(() => props.title || t("chat.startQuestion"));
const isComposerExpanded = computed(() => Boolean(props.isComposerExpanded));

const normalizedSuggestions = computed(() =>
  (props.suggestions || [])
    .filter(Boolean)
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `suggestion-${index}-${item}`,
          text: item,
          title: item,
          prompt: item,
        };
      }
      const text = item.text || item.title || item.prompt || "";
      return {
        ...item,
        id: item.id || `suggestion-${index}-${text}`,
        text,
        title: item.title || text,
        prompt: item.prompt || text,
      };
    })
    .filter((item) => item.text)
);

function handleSuggestionClick(item) {
  if (props.disableInteractions) return;
  emit("suggestion-click", item);
}

function handleStudioDetailClick() {
  if (props.studioDetailDisabled) return;
  studioDetailActions.open?.();
}
</script>

<style scoped lang="scss">
.main-empty-state__title {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.main-empty-state__composer-dock {
  width: min(var(--layout-prompt-width, 880px), 100%);
  max-width: var(--layout-prompt-width, 880px);
}

.studio-detail-trigger {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-controlBorder, #d1d5db);
  border-radius: 999px;
  background: var(--app-control, #fff);
  color: var(--app-subtle, #6b7280);
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}

.studio-detail-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

/*
 * Mobile main composer owns a separate dock outside .empty-center.
 * This keeps the prompt out of the legacy empty-state flow when
 * body.mobile-mode, viewportStore, or Tailwind utility timing briefly disagree.
 */
.empty-stage--mobile-main {
  position: relative;
}

.empty-stage--mobile-main .main-empty-state__center {
  padding-bottom: calc(
    var(--mobile-main-composer-space, 174px) + var(--mobile-keyboard-inset, 0px)
  );
}

.empty-stage--mobile-main .main-empty-state__composer-dock {
  position: fixed;
  right: 0;
  bottom: calc(
    var(--composer-keyboard-inset, 0px) + env(safe-area-inset-bottom, 0px)
  );
  left: 0;
  z-index: var(--mobile-main-composer-z, var(--z-prompt-floating, 90));
  box-sizing: border-box;
  width: 100dvw;
  max-width: 100dvw;
  padding: 8px 12px max(12px, env(safe-area-inset-bottom, 0px));
  overflow: visible;
  background: transparent;
  pointer-events: none;
}

.empty-stage--mobile-main .main-empty-state__composer-dock > * {
  pointer-events: auto;
}

.empty-stage--mobile-main
  .main-empty-state__composer-dock
  .mobile-main-fixed-prompt {
  position: static !important;
  inset: auto !important;
  box-sizing: border-box;
  width: 100% !important;
  max-width: min(100%, var(--layout-prompt-width, 880px)) !important;
  margin: 0 auto !important;
  padding: 0 !important;
  overflow: visible !important;
  background: transparent !important;
  box-shadow: none !important;
}

.main-empty-state--preview {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 50% 0%,
      color-mix(in srgb, var(--studio-primary, #10a37f) 10%, transparent),
      transparent 38%
    ),
    var(--studio-surface, #fff);
}

.main-empty-state--preview .main-empty-state__center {
  width: min(100%, 560px);
  max-width: 560px;
  padding: 56px 28px 32px;
  box-sizing: border-box;
}

.main-empty-state--preview .main-empty-state__subtitle {
  max-width: 420px;
  margin: -2px auto 4px;
  color: var(--studio-muted, #6b7280);
  font-size: 14px;
  line-height: 1.55;
}

.main-empty-state--preview .main-empty-state__suggestions {
  order: 20 !important;
  display: flex !important;
  grid-template-columns: none !important;
  flex-direction: column !important;
  flex-wrap: nowrap !important;
  align-items: stretch !important;
  justify-content: flex-start !important;
  width: min(100%, 520px);
  margin: 8px auto 0;
}

.main-empty-state--preview .suggestion-chip {
  width: 100% !important;
  max-width: 100% !important;
  justify-content: flex-start !important;
  text-align: left !important;
  cursor: default;
}

.main-empty-state--preview .suggestion-chip-text {
  display: block !important;
  min-width: 0 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
</style>
