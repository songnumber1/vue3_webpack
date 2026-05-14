<!--
@file ChatImagePreview.vue
@description Full-screen image preview dialog for chat attachment images.
@author OpenAI
-->

<template>
  <div
    v-if="image"
    class="image-preview-backdrop"
    role="dialog"
    aria-modal="true"
    :aria-label="image.name"
    @click="$emit('close')"
  >
    <button
      type="button"
      class="image-preview-close"
      aria-label="닫기"
      @click.stop="$emit('close')"
    >
      ×
    </button>
    <div class="image-preview-stage" @click.stop>
      <div v-if="image.loading" class="image-preview-loading" role="status">
        이미지를 불러오는 중입니다...
      </div>
      <div v-if="image.error" class="image-preview-error" role="alert">
        이미지를 미리보기로 표시할 수 없습니다.
      </div>
      <img
        v-if="image.url && !image.error"
        :key="image.url"
        class="image-preview-large"
        :class="{ 'image-preview-large--hidden': image.loading }"
        :src="image.url"
        :alt="image.name"
        @load="$emit('load')"
        @error="$emit('error')"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  image: { type: Object, default: null },
});

defineEmits(["close", "load", "error"]);
</script>
