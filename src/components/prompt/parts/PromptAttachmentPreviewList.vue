<template>
  <div v-if="attachments.length" class="attachment-preview-row" aria-label="첨부 파일 목록">
    <div
      v-for="file in attachments"
      :key="file.id"
      class="attachment-preview-card"
      :class="{'attachment-preview-card--image': file.kind === 'image'}"
      :role="file.kind === 'image' ? 'button' : undefined"
      :tabindex="file.kind === 'image' ? 0 : undefined"
      :aria-label="file.kind === 'image' ? `${file.name} 미리보기` : undefined"
      @click="emitPreview(file)"
      @keydown.enter.prevent="emitPreview(file)"
      @keydown.space.prevent="emitPreview(file)"
    >
      <div v-if="file.kind === 'image'" class="attachment-preview-thumb" aria-hidden="true">
        <img :src="getPreviewUrl(file)" :alt="file.name" @error="$emit('preview-error', file)" />
      </div>
      <div v-else class="attachment-preview-file" aria-hidden="true">📄</div>
      <div class="attachment-preview-info">
        <strong :title="file.name">{{ file.name }}</strong>
        <span>{{ formatFileSize(file.size) }}</span>
      </div>
      <button
        type="button"
        class="attachment-preview-remove"
        :aria-label="`${file.name} 제거`"
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
import {formatFileSize} from '@/utils/attachment';
// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
defineProps({
  attachments: {type: Array, default: () => []},
});

const emit = defineEmits(['preview', 'remove', 'preview-error']);

/**
 * @description getPreviewUrl 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} file - file 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getPreviewUrl(file) {
  // 계산된 결과를 호출부로 반환합니다.
  return file?.dataUrl || file?.previewUrl || file?.url || '';
}

/**
 * @description emitPreview 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} file - file 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function emitPreview(file) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (file?.kind !== 'image') return;
  emit('preview', file);
}
</script>
