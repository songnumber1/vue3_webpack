<template>
  <article class="studio-mobile-page studio-mobile-page--detail" aria-label="Assistant Studio 상세">
    <header class="studio-mobile-page__head studio-mobile-page__head--notice">
      <button class="studio-mobile-page__back" type="button" aria-label="뒤로" @click="$emit('close')">‹</button>
      <strong>{{ studio.name }}</strong>
      <button class="studio-mobile-page__close" type="button" aria-label="닫기" @click="$emit('close')">×</button>
    </header>
    <div class="studio-mobile-page__content">
      <StudioDetailContent :studio="studio" />
    </div>
  </article>
</template>

<script setup>
import StudioDetailContent from "@/views/studio/components/StudioDetailContent.vue";

defineProps({
  studio: {type: Object, required: true},
});
defineEmits(["close"]);
</script>
