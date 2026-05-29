<template>
  <aside class="studio-preview" :aria-label="t('studio.preview.label')">
    <div class="studio-preview__label">{{ t('studio.preview.label') }}</div>
    <div class="studio-preview__card">
      <div class="studio-preview__logo">{{ initial }}</div>
      <h2>{{ name || t('studio.preview.fallbackName') }}</h2>
      <p>{{ description || t('studio.preview.fallbackDescription') }}</p>
      <div class="studio-prompt-grid studio-prompt-grid--preview">
        <button v-for="prompt in prompts" :key="prompt" type="button">{{ prompt }}<span aria-hidden="true">›</span></button>
      </div>
      <small>{{ t('studio.preview.note') }}</small>
    </div>
  </aside>
</template>

<script setup>
import {useI18n} from "vue-i18n";
const {t} = useI18n();

defineProps({
  initial: {type: String, default: "A"},
  name: {type: String, default: ""},
  description: {type: String, default: ""},
  prompts: {type: Array, default: () => []},
});
</script>
