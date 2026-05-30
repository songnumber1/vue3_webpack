<template>
  <main class="legal-page legal-page--terms flex h-[var(--app-height,100vh)] min-h-0 w-full flex-col items-center justify-center overflow-hidden overscroll-contain bg-app-bg px-[18px] py-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] text-app-text" role="main">
    <section class="legal-card my-auto flex max-h-full min-h-0 w-[min(100%,860px)] flex-col overflow-hidden rounded-3xl border border-app-border bg-app-surface px-7 pt-7 shadow-soft mobile:px-5 mobile:pt-5" aria-labelledby="terms-title">
      <header class="legal-header flex-none">
        <p class="mb-2 mt-0 text-[var(--text-size-caption)] font-extrabold uppercase tracking-[.08em] text-app-primary">{{ t("legal.terms.eyebrow") }}</p>
        <h1 id="terms-title" class="m-0 text-[var(--text-size-page-title)] font-extrabold leading-tight">{{ t("legal.terms.title") }}</h1>
        <p class="mb-0 mt-3 text-[var(--text-size-body-strong)] leading-[1.7] text-app-subtle">{{ t("legal.terms.description") }}</p>
      </header>

      <div class="legal-content app-scroll-area mt-7 grid gap-[18px] pb-7">
        <section
          v-for="section in termsSections"
          :key="section.title"
          class="legal-section app-section-card p-[18px]"
        >
          <h2 class="mb-2 mt-0 text-[var(--text-size-title)] leading-[1.35]">{{ section.title }}</h2>
          <p class="m-0 text-[var(--text-size-body)] leading-[1.75] text-app-subtle">{{ section.body }}</p>
        </section>
      </div>

      <footer class="terms-agreement relative z-[1] -mx-7 flex flex-none items-center justify-between gap-4 rounded-b-3xl border-t border-app-border bg-app-surface/95 px-7 py-[18px] backdrop-blur mobile:-mx-5 mobile:flex-col mobile:items-stretch mobile:px-5" aria-label="terms agreement">
        <label class="terms-check flex min-w-0 items-center gap-2 text-[var(--text-size-body)] font-bold text-app-text">
          <input v-model="agreed" class="size-[18px] accent-[var(--primary,#10a37f)]" type="checkbox" />
          <span>{{ t("legal.terms.agreeLabel") }}</span>
        </label>
        <button
          type="button"
          class="legal-primary-button min-h-[44px] rounded-[14px] border-0 bg-slate-900 px-6 text-[var(--text-size-body-strong)] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50 mobile:w-full"
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
