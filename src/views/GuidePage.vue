<template>
  <section class="guide-page">
    <header class="guide-hero">
      <RouterLink class="guide-back" to="/"
        >‹ {{ t("common.back") }}</RouterLink
      >
      <h1>{{ t("guide.title") }}</h1>
      <p>{{ t("guide.subtitle") }}</p>
    </header>
    <div class="guide-grid">
      <article
        v-for="section in sections"
        :key="section.title"
        class="guide-card"
      >
        <span>Guide</span>
        <h2>{{ section.title }}</h2>
        <p>{{ section.body }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
/**
 * @file views/GuidePage.vue
 * @description 라우터가 직접 렌더하는 페이지 진입 컴포넌트입니다. 대부분 실제 로직은 container에 위임합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";

const {t, tm} = useI18n();
const sections = computed(() => tm("guide.sections"));
</script>
