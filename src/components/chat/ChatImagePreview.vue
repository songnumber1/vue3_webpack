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
      :aria-label="t('chat.imagePreview.close')"
      @click.stop="$emit('close')"
    >
      ×
    </button>
    <div class="image-preview-stage" @click.stop>
      <div v-if="image.loading" class="image-preview-loading" role="status">
        {{ t("chat.imagePreview.loading") }}
      </div>
      <div v-if="image.error" class="image-preview-error" role="alert">
        {{ t("chat.imagePreview.error") }}
      </div>
      <img
        v-if="image.url && !image.error"
        :key="image.url"
        class="image-preview-large"
        :class="{'image-preview-large--hidden': image.loading}"
        :src="image.url"
        :alt="image.name"
        @load="$emit('load')"
        @error="$emit('error')"
      />
    </div>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";

const {t} = useI18n();

defineProps({
  image: {type: Object, default: null},
});

defineEmits(["close", "load", "error"]);
</script>

<style scoped>
/* Scoped layout guard: keep component roots and flex/grid children shrink-safe. */
:where(*) {
  box-sizing: border-box;
  min-width: 0;
}
</style>
