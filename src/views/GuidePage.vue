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

const {t, tm} = useI18n();
const sections = computed(() => tm("guide.sections"));
</script>
