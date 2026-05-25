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
/**
 * @file views/NotFoundPage.vue
 * @description 라우터가 직접 렌더하는 페이지 진입 컴포넌트입니다. 대부분 실제 로직은 container에 위임합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {useI18n} from "vue-i18n";

const {t} = useI18n();

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.assign("/");
}
</script>
