<template>
  <main class="exception-page">
    <section class="exception-card">
      <p class="exception-code">404 NOT FOUND</p>
      <h1 class="exception-title">{{ t("notFound.title") }}</h1>
      <p class="exception-description">{{ t("notFound.description") }}</p>
      <div class="exception-actions">
        <RouterLink to="/" class="exception-button">
          {{ t("notFound.goHome") }}
        </RouterLink>
        <button
          type="button"
          class="exception-button exception-button--secondary"
          @click="goBack"
        >
          {{ t("notFound.goBack") }}
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import {useI18n} from "vue-i18n";

const {t} = useI18n();

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.assign("/");
}
</script>
