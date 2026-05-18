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
import {computed} from "vue";
import {useI18n} from "vue-i18n";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const {t, tm} = useI18n();
const sections = computed(() => tm("guide.sections"));
</script>
