<template>
  <aside class="studio-preview" aria-label="Assistant 미리보기">
    <div class="studio-preview__label">미리보기</div>
    <div class="studio-preview__card">
      <div class="studio-preview__logo">{{ initial }}</div>
      <h2>{{ name || 'Assistant 이름' }}</h2>
      <p>{{ description || '설명을 입력하고 적용을 누르면 미리보기에 표시됩니다.' }}</p>
      <div class="studio-prompt-grid studio-prompt-grid--preview">
        <button v-for="prompt in prompts" :key="prompt" type="button">{{ prompt }}<span aria-hidden="true">›</span></button>
      </div>
      <small>미리보기는 실제 Assistant와 다를 수 있습니다.</small>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  initial: {type: String, default: "A"},
  name: {type: String, default: ""},
  description: {type: String, default: ""},
  prompts: {type: Array, default: () => []},
});
</script>
