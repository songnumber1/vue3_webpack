<template>
  <div class="studio-detail-content">
    <div class="studio-dialog__head">
      <div class="studio-dialog__image">{{ studio.initial }}</div>
      <div>
        <h2>{{ studio.name }}</h2>
        <p>좋아요 {{ studio.likes }} · 질문 {{ studio.views }} · {{ studio.owner }} · {{ studio.model }}</p>
      </div>
    </div>
    <p class="studio-dialog__desc">{{ studio.description }}</p>
    <h3>프롬프트 예시</h3>
    <div class="studio-prompt-grid">
      <button v-for="prompt in studio.prompts" :key="prompt" type="button">{{ prompt }}</button>
    </div>
    <h3>학습 사내 지식</h3>
    <p class="studio-dialog__box">{{ studio.knowledge }}</p>
    <h3>공개 범위</h3>
    <p class="studio-dialog__box">{{ studio.scope }}</p>
  </div>
</template>

<script setup>
defineProps({
  studio: {type: Object, required: true},
});
</script>
