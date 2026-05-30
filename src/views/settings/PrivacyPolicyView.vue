<template>
  <div class="grid gap-[18px] text-app-text mobile:gap-4">
    <header class="grid gap-2">
      <p class="m-0 text-[var(--text-size-caption)] font-extrabold uppercase tracking-[.08em] text-app-primary">{{ t("legal.privacy.eyebrow") }}</p>
      <h2 class="m-0 text-[var(--text-size-page-title)] font-[850] leading-tight">{{ t("legal.privacy.title") }}</h2>
      <p class="m-0 text-[var(--text-size-body)] leading-[1.7] text-app-subtle">{{ t("legal.privacy.description") }}</p>
    </header>

    <div class="grid gap-3">
      <article
        v-for="section in privacySections"
        :key="section.title"
        class="rounded-2xl border border-app-border bg-app-muted p-4 mobile:p-[15px]"
      >
        <h3 class="mb-2 mt-0 text-[var(--text-size-title)] leading-[1.35]">{{ section.title }}</h3>
        <p class="m-0 text-[var(--text-size-helper)] leading-[1.75] text-app-subtle">{{ section.body }}</p>
      </article>
    </div>

    <p class="mb-0 mt-0.5 text-[var(--text-size-helper)] text-app-subtle">{{ t("legal.updatedAt") }}</p>
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
