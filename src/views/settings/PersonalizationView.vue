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
          :class="{active: selectedStyle === option.value}"
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
/**
 * @file views/settings/PersonalizationView.vue
 * @description 라우터가 직접 렌더하는 페이지 진입 컴포넌트입니다. 대부분 실제 로직은 container에 위임합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const memoryEnabled = ref(true);
const selectedStyle = ref("detailed");
const styleOptions = computed(() => [
  {value: "compact", label: t("personalization.compact")},
  {value: "detailed", label: t("personalization.detailed")},
  {value: "technical", label: t("personalization.technical")},
]);
</script>
