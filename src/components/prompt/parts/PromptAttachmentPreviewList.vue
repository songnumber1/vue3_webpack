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
      :aria-label="file.kind === 'image' ? t('chat.attachment.preview', {name: file.name}) : undefined"
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
import {useI18n} from "vue-i18n";
import {formatFileSize} from "@/utils/attachment";

const {t} = useI18n();

defineProps({
  attachments: {type: Array, default: () => []},
});

const emit = defineEmits(["preview", "remove", "preview-error"]);

function getPreviewUrl(file) {
  return file?.dataUrl || file?.previewUrl || file?.url || "";
}

function emitPreview(file) {
  if (file?.kind !== "image") return;
  emit("preview", file);
}
</script>
