<!--
@file PersonalizationView.vue
@description ChatGPT-like personalization settings sample view.
-->

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
          v-for="option in styleOptions"
          :key="option.value"
          class="style-chip"
          :class="{ active: selectedStyle === option.value }"
          type="button"
          @click="selectedStyle = option.value"
        >
          {{ option.label }}
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
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const memoryEnabled = ref(true);
const selectedStyle = ref("detailed");
const styleOptions = computed(() => [
  { value: "compact", label: t("personalization.compact") },
  { value: "detailed", label: t("personalization.detailed") },
  { value: "technical", label: t("personalization.technical") },
]);
</script>
