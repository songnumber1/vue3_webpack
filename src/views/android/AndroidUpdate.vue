<template>
  <main class="exception-page">
    <section class="exception-card">
      <p class="exception-code">{{ t("androidUpdate.label") }}</p>
      <h1 class="exception-title">{{ title }}</h1>
      <p class="exception-description">{{ message }}</p>
      <div class="exception-info-list">
        <div class="exception-info-item">
          <span class="exception-info-label">{{
            t("androidUpdate.currentVersion")
          }}</span>
          <strong class="exception-info-value">{{ currentVersion }}</strong>
        </div>
        <div class="exception-info-item">
          <span class="exception-info-label">{{
            t("androidUpdate.latestVersion")
          }}</span>
          <strong class="exception-info-value">{{ latestVersion }}</strong>
        </div>
      </div>
      <div class="exception-actions">
        <button type="button" class="exception-button" @click="requestUpdate">
          {{ t("androidUpdate.doUpdate") }}
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
/**
 * @file views/android/AndroidUpdate.vue
 * @description 라우터가 직접 렌더하는 페이지 진입 컴포넌트입니다. 대부분 실제 로직은 container에 위임합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useAppContext} from "@/composables/app/useAppContext";

const {appInfo, bridge} = useAppContext();
const {t} = useI18n();

const versionInfo = computed(() => appInfo.lastVersionInfo || {});
const currentVersion = computed(() => appInfo.appVersion || "unknown");
const latestVersion = computed(() => versionInfo.value.version || "unknown");
const title = computed(
  () => versionInfo.value.title || t("androidUpdate.defaultTitle")
);
const message = computed(
  () => versionInfo.value.message || t("androidUpdate.defaultMessage")
);

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function requestUpdate() {
  if (typeof bridge?.openMarket === "function") {
    bridge.openMarket();
    return;
  }
  if (typeof window.AndroidBridge?.openMarket === "function") {
    window.AndroidBridge.openMarket();
  }
}
</script>
