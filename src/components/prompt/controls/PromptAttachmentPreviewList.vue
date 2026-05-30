<template>
  <div
    v-if="attachments.length"
    class="attachment-preview-row"
    :aria-label="t('chat.attachment.listLabel')"
  >
    <div
      v-for="file in attachments"
      :key="file.id"
      class="attachment-preview-card"
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
        class="attachment-preview-thumb"
        aria-hidden="true"
      >
        <img
          :src="getPreviewUrl(file)"
          :alt="file.name"
          @error="$emit('preview-error', file)"
        />
      </div>
      <div v-else class="attachment-preview-file" aria-hidden="true">📄</div>
      <div class="attachment-preview-info">
        <strong :title="file.name">{{ file.name }}</strong>
        <span>{{ formatFileSize(file.size) }}</span>
      </div>
      <button
        type="button"
        class="attachment-preview-remove"
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
