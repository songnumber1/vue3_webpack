<template>
  <article
    class="studio-mobile-page studio-mobile-page--detail"
    :aria-label="t('studio.detail.title')"
  >
    <header class="studio-mobile-page__head studio-mobile-page__head--notice">
      <button
        class="studio-mobile-page__back"
        type="button"
        :aria-label="t('common.back')"
        @click="$emit('close')"
      >
        ‹
      </button>
      <strong>{{ studio.name }}</strong>
      <button
        class="studio-mobile-page__close"
        type="button"
        :aria-label="t('common.close')"
        @click="$emit('close')"
      >
        ×
      </button>
    </header>
    <div class="studio-mobile-page__content">
      <StudioDetailContent :studio="studio" />
    </div>
  </article>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import StudioDetailContent from "@/components/studio/StudioDetailContent.vue";
const {t} = useI18n();

defineProps({studio: {type: Object, required: true}});
defineEmits(["close"]);
</script>
