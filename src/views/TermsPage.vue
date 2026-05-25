<template>
  <main class="legal-page legal-page--terms" role="main">
    <section class="legal-card" aria-labelledby="terms-title">
      <header class="legal-header">
        <p class="legal-eyebrow">{{ t("legal.terms.eyebrow") }}</p>
        <h1 id="terms-title">{{ t("legal.terms.title") }}</h1>
        <p class="legal-description">{{ t("legal.terms.description") }}</p>
      </header>

      <div class="legal-content">
        <section
          v-for="section in termsSections"
          :key="section.title"
          class="legal-section"
        >
          <h2>{{ section.title }}</h2>
          <p>{{ section.body }}</p>
        </section>
      </div>

      <footer class="terms-agreement" aria-label="terms agreement">
        <label class="terms-check">
          <input v-model="agreed" type="checkbox" />
          <span>{{ t("legal.terms.agreeLabel") }}</span>
        </label>
        <button
          type="button"
          class="legal-primary-button"
          :disabled="!agreed"
          @click="confirmTerms"
        >
          {{ t("common.confirm") }}
        </button>
      </footer>
    </section>
  </main>
</template>

<script setup>
/**
 * @file views/TermsPage.vue
 * @description 라우터가 직접 렌더하는 페이지 진입 컴포넌트입니다. 대부분 실제 로직은 container에 위임합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";

const {t, tm} = useI18n();
const router = useRouter();
const agreed = ref(false);
const termsSections = computed(() => tm("legal.terms.sections") || []);

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function confirmTerms() {
  if (!agreed.value) return;
  router.replace({path: "/"});
}
</script>

<style scoped>
.legal-page {
  width: 100%;
  height: var(--app-height, 100vh);
  min-height: 0;
  padding: max(24px, env(safe-area-inset-top)) 18px
    max(24px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--app-bg, #f7f7f8);
  color: var(--text-primary, #111827);
  overflow: hidden;
  overscroll-behavior: contain;
}
.legal-card {
  width: min(100%, 860px);
  max-height: 100%;
  min-height: 0;
  margin-block: auto;
  padding: 28px 28px 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 24px;
  background: var(--surface-primary, #ffffff);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}
.legal-eyebrow {
  margin: 0 0 8px;
  font-size: var(--text-size-caption);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--accent-primary, #10a37f);
  text-transform: uppercase;
}
.legal-header h1 {
  margin: 0;
  font-size: var(--text-size-page-title);
  line-height: 1.25;
  font-weight: 800;
}
.legal-description {
  margin: 12px 0 0;
  color: var(--text-secondary, #6b7280);
  font-size: var(--text-size-body-strong);
  line-height: 1.7;
}
.legal-header {
  flex: 0 0 auto;
}
.legal-content {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  gap: 18px;
  margin-top: 28px;
  padding-bottom: 28px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.legal-section {
  padding: 18px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.78);
}
.legal-section h2 {
  margin: 0 0 8px;
  font-size: var(--text-size-title);
  line-height: 1.35;
}
.legal-section p {
  margin: 0;
  color: var(--text-secondary, #4b5563);
  font-size: var(--text-size-body);
  line-height: 1.75;
}
.terms-agreement {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 -28px;
  padding: 18px 28px;
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 0 0 24px 24px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
}
.terms-check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary, #111827);
  font-size: var(--text-size-body);
  font-weight: 700;
  cursor: pointer;
}
.terms-check input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-primary, #10a37f);
}
.legal-primary-button {
  min-width: 120px;
  min-height: 44px;
  border: 0;
  border-radius: 14px;
  background: #111827;
  color: #ffffff;
  font-size: var(--text-size-body);
  font-weight: 800;
  cursor: pointer;
}
.legal-primary-button:disabled {
  background: #d1d5db;
  color: #6b7280;
  cursor: not-allowed;
}
@media (max-width: 720px) {
  .legal-page {
    align-items: stretch;
    justify-content: flex-start;
    padding: max(18px, env(safe-area-inset-top)) 14px
      max(18px, env(safe-area-inset-bottom));
  }
  .legal-card {
    width: 100%;
    max-height: 100%;
    margin-block: 0;
    padding: 22px 16px 0;
    border-radius: 20px;
  }
  .terms-agreement {
    align-items: stretch;
    flex-direction: column;
    margin: 0 -16px;
    padding: 16px;
    border-radius: 0 0 20px 20px;
  }
  .legal-primary-button {
    width: 100%;
  }
}
</style>
