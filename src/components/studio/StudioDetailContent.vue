<template>
  <div class="studio-detail-content">
    <header class="studio-dialog__head">
      <div class="studio-dialog__image">{{ studio.initial }}</div>
      <div>
        <h2>{{ studio.name }}</h2>
        <p>{{ t('studio.likes') }} {{ studio.likes }} · {{ t('studio.questions') }} {{ studio.views }} · {{ studio.owner }} · {{ studio.model }}</p>
      </div>
    </header>
    <p class="studio-dialog__desc">{{ studio.description }}</p>

    <h3>{{ t('studio.detail.prompts') }}</h3>
    <div class="studio-prompt-grid">
      <button v-for="prompt in studio.prompts" :key="prompt" type="button">{{ prompt }}</button>
    </div>
    <h3>{{ t('studio.detail.knowledge') }}</h3>
    <p class="studio-dialog__box">{{ studio.knowledge }}</p>
    <h3>{{ t('studio.detail.scope') }}</h3>
    <p class="studio-dialog__box">{{ studio.scope }}</p>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";
const {t} = useI18n();

defineProps({studio: {type: Object, required: true}});
</script>
