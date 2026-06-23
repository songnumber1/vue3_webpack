<template>
  <div class="personalization-view">
    <section class="personal-card personalization-hero">
      <div>
        <span class="personal-eyebrow">AI Profile</span>
        <h3>{{ t("personalization.memoryTitle") }}</h3>
        <p>{{ t("personalization.memoryBody") }}</p>
      </div>
      <label class="switch-row">
        <input v-model="memoryEnabled" type="checkbox" />
        <span></span>
      </label>
    </section>

    <section class="personal-card">
      <h3>{{ t("personalization.styleTitle") }}</h3>
      <p>{{ t("personalization.styleBody") }}</p>
      <div class="style-chip-group">
        <button
          class="style-chip"
          :class="{active: selectedStyle === 'compact'}"
          type="button"
          @click="selectedStyle = 'compact'"
        >
          {{ t("personalization.compact") }}
        </button>
        <button
          class="style-chip"
          :class="{active: selectedStyle === 'detailed'}"
          type="button"
          @click="selectedStyle = 'detailed'"
        >
          {{ t("personalization.detailed") }}
        </button>
        <button
          class="style-chip"
          :class="{active: selectedStyle === 'technical'}"
          type="button"
          @click="selectedStyle = 'technical'"
        >
          {{ t("personalization.technical") }}
        </button>
      </div>
    </section>

    <section class="personal-card">
      <h3>{{ t("personalization.dataTitle") }}</h3>
      <p>{{ t("personalization.dataBody") }}</p>
      <button class="secondary-action" type="button">
        {{ t("common.settings") }}
      </button>
    </section>
  </div>
</template>

<script setup>
/**
 * @file views/settings/PersonalizationView.vue
 * @description 개인화 설정 화면입니다. 고정 스타일 옵션은 template에서 직접 렌더링합니다.
 */

import {ref} from "vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const memoryEnabled = ref(true);
const selectedStyle = ref("detailed");
</script>
