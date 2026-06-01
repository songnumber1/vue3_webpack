<template>
  <div
    v-if="attachments.length"
    class="attachment-preview-row tw-flex tw-w-full tw-gap-2 tw-overflow-x-auto"
    :aria-label="t('chat.attachment.listLabel')"
  >
    <div
      v-for="file in attachments"
      :key="file.id"
      class="attachment-preview-card tw-relative tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-rounded-control tw-border tw-border-app-border tw-bg-app-surface"
      :class="{'attachment-preview-card--image': file.kind === 'image'}"
      :role="file.kind === 'image' ? 'button' : undefined"
      :tabindex="file.kind === 'image' ? 0 : undefined"
      :aria-label="
        file.kind === 'image'
          ? t('chat.attachment.preview', {name: file.name})
          : undefined
      "
      @click="emitPreview(file)"
      @keydown.enter.prevent="emitPreview(file)"
      @keydown.space.prevent="emitPreview(file)"
    >
      <div
        v-if="file.kind === 'image'"
        class="attachment-preview-thumb tw-block tw-shrink-0 tw-object-cover"
        aria-hidden="true"
      >
        <img
          :src="getPreviewUrl(file)"
          :alt="file.name"
          @error="$emit('preview-error', file)"
        />
      </div>
      <div v-else class="attachment-preview-file tw-flex tw-shrink-0 tw-items-center tw-justify-center" aria-hidden="true">📄</div>
      <div class="attachment-preview-info tw-min-w-0 tw-flex-1">
        <strong :title="file.name">{{ file.name }}</strong>
        <span>{{ formatFileSize(file.size) }}</span>
      </div>
      <button
        type="button"
        class="attachment-preview-remove tw-absolute tw-inline-flex tw-items-center tw-justify-center tw-rounded-full"
        :aria-label="t('chat.attachment.remove', {name: file.name})"
        @pointerdown.stop
        @mousedown.stop
        @touchstart.stop
        @click.stop.prevent="$emit('remove', file.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptAttachmentPreviewList.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {useI18n} from "vue-i18n";
import {formatFileSize} from "@/utils/attachment";

const {t} = useI18n();

defineProps({
  attachments: {type: Array, default: () => []},
});

const emit = defineEmits(["preview", "remove", "preview-error"]);

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getPreviewUrl(file) {
  return file?.dataUrl || file?.previewUrl || file?.url || "";
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function emitPreview(file) {
  if (file?.kind !== "image") return;
  emit("preview", file);
}
</script>

<style scoped lang="scss">
/* Attachment preview sizing belongs to the preview list component. */
:global(body.mobile-mode) .attachment-preview-row {
  width: 100%;
  align-self: stretch;
  justify-content: flex-start;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
  padding: 10px 38px 8px 2px;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: thin;
}

:global(body.mobile-mode .app-container:not(.app-container--native-scroll-runtime) .attachment-preview-row) {
  scrollbar-width: none;
}

:global(body.mobile-mode .app-container:not(.app-container--native-scroll-runtime) .attachment-preview-row::-webkit-scrollbar) {
  display: none;
}

:global(body.mobile-mode) .attachment-preview-card,
:global(body.mobile-mode) .attachment-preview-card--image {
  flex: 0 0 var(--attachment-mobile-size);
  width: var(--attachment-mobile-size);
  height: var(--attachment-mobile-size);
  min-width: var(--attachment-mobile-size);
  min-height: var(--attachment-mobile-size);
  max-width: var(--attachment-mobile-size);
  max-height: var(--attachment-mobile-size);
  display: grid;
  place-items: center;
  padding: 6px;
  border-radius: var(--attachment-mobile-radius);
  overflow: visible;
}

:global(body.mobile-mode) .attachment-preview-thumb,
:global(body.mobile-mode) .attachment-preview-file {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  place-items: center;
  border-radius: var(--attachment-mobile-thumb-radius);
}

:global(body.mobile-mode) .attachment-preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--attachment-mobile-thumb-radius);
}

:global(body.mobile-mode) .attachment-preview-file {
  font-size: var(--text-size-icon-lg);
  line-height: 1;
  background: var(--surface, #f8fafc);
}

:global(body.mobile-mode) .attachment-preview-info,
:global(body.mobile-mode) .attachment-preview-info strong,
:global(body.mobile-mode) .attachment-preview-info span,
:global(body.mobile-mode)
  .attachment-preview-card--image
  .attachment-preview-info {
  display: none;
}

:global(body.mobile-mode) .attachment-preview-remove,
:global(body.mobile-mode)
  .attachment-preview-card--image
  .attachment-preview-remove {
  top: var(--attachment-mobile-remove-offset);
  right: var(--attachment-mobile-remove-offset);
  width: var(--attachment-mobile-remove-size);
  height: var(--attachment-mobile-remove-size);
  min-width: var(--attachment-mobile-remove-size);
  min-height: var(--attachment-mobile-remove-size);
  padding: 0 0 2px;
  font-size: var(--text-size-icon);
  line-height: 1;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.14);
}

:global(body.mobile-mode) .attachment-preview-remove::before {
  inset: -8px;
}
</style>
