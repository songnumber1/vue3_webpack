<template>
  <div class="privacy-policy-view">
    <header class="privacy-policy-header">
      <p class="privacy-policy-eyebrow">{{ t("legal.privacy.eyebrow") }}</p>
      <h2>{{ t("legal.privacy.title") }}</h2>
      <p>{{ t("legal.privacy.description") }}</p>
    </header>

    <div class="privacy-policy-sections">
      <article
        v-for="section in privacySections"
        :key="section.title"
        class="privacy-policy-card"
      >
        <h3>{{ section.title }}</h3>
        <p>{{ section.body }}</p>
      </article>
    </div>

    <p class="privacy-policy-updated">{{ t("legal.updatedAt") }}</p>
  </div>
</template>

<script setup>
/**
 * @file views/settings/PrivacyPolicyView.vue
 * @description 라우터가 직접 렌더하는 페이지 진입 컴포넌트입니다. 대부분 실제 로직은 container에 위임합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";

const {t, tm} = useI18n();
const privacySections = computed(() => tm("legal.privacy.sections") || []);
</script>

<style scoped>
.privacy-policy-view {
  display: grid;
  gap: 18px;
  color: var(--text-primary, #111827);
}
.privacy-policy-header {
  display: grid;
  gap: 8px;
}
.privacy-policy-eyebrow {
  margin: 0;
  color: var(--accent-primary, #10a37f);
  font-size: var(--text-size-caption);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.privacy-policy-header h2 {
  margin: 0;
  font-size: var(--text-size-page-title);
  line-height: 1.25;
  font-weight: 850;
}
.privacy-policy-header p:last-child {
  margin: 0;
  color: var(--text-secondary, #6b7280);
  font-size: var(--text-size-body);
  line-height: 1.7;
}
.privacy-policy-sections {
  display: grid;
  gap: 12px;
}
.privacy-policy-card {
  padding: 16px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.78);
}
.privacy-policy-card h3 {
  margin: 0 0 8px;
  font-size: var(--text-size-title);
  line-height: 1.35;
}
.privacy-policy-card p {
  margin: 0;
  color: var(--text-secondary, #4b5563);
  font-size: var(--text-size-helper);
  line-height: 1.75;
}
.privacy-policy-updated {
  margin: 2px 0 0;
  color: var(--text-muted, #9ca3af);
  font-size: var(--text-size-helper);
}
@media (max-width: 720px) {
  .privacy-policy-view {
    gap: 16px;
  }
  .privacy-policy-card {
    padding: 15px;
  }
}
</style>
