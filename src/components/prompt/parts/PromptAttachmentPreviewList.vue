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
defineProps({
  attachments: {type: Array, default: () => []},
});

const emit = defineEmits(['preview', 'remove', 'preview-error']);

/**
 * Returns the best available preview URL for a local or native attachment.
 * @param {object} file Attachment view model.
 * @returns {string} Resolved preview URL.
 */
function getPreviewUrl(file) {
  return file?.dataUrl || file?.previewUrl || file?.url || '';
}

/**
 * Emits preview only for image attachments.
 * @param {object} file Attachment view model.
 * @returns {void}
 */
function emitPreview(file) {
  if (file?.kind !== 'image') return;
  emit('preview', file);
}

/**
 * Formats byte size for compact attachment cards.
 * @param {number} size File size in bytes.
 * @returns {string} Human-readable size.
 */
function formatFileSize(size) {
  if (!size) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
</script>
