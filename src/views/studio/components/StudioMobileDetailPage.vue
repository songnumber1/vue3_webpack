<template>
  <article class="studio-mobile-page" aria-label="Assistant Studio 상세">
    <header class="studio-mobile-page__head">
      <button type="button" aria-label="뒤로" @click="$emit('close')">‹</button>
      <strong>{{ studio.name }}</strong>
    </header>
    <StudioDetailContent :studio="studio" />
  </article>
</template>

<script setup>
import StudioDetailContent from "@/views/studio/components/StudioDetailContent.vue";

defineProps({
  studio: {type: Object, required: true},
});
defineEmits(["close"]);
</script>
