<!--
@file AndroidUpdate.vue * @description Vue component used in the chat web
application runtime. * @author OpenAI
-->

<template>
  <main class="exception-page">
    <section class="exception-card">
      <p class="exception-code">UPDATE REQUIRED</p>

      <h1 class="exception-title">
        {{ title }}
      </h1>

      <p class="exception-description">
        {{ message }}
      </p>

      <div class="exception-info-list">
        <div class="exception-info-item">
          <span class="exception-info-label"> 현재 버전 </span>

          <strong class="exception-info-value">
            {{ currentVersion }}
          </strong>
        </div>

        <div class="exception-info-item">
          <span class="exception-info-label"> 최신 버전 </span>

          <strong class="exception-info-value">
            {{ latestVersion }}
          </strong>
        </div>
      </div>

      <div class="exception-actions">
        <button type="button" class="exception-button" @click="requestUpdate">
          업데이트 진행
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from "vue";
import { useAppContext } from "@/composables/useAppContext";

const { appInfo, bridge } = useAppContext();

const versionInfo = computed(() => appInfo.lastVersionInfo || {});

const currentVersion = computed(() => appInfo.appVersion || "unknown");

const latestVersion = computed(() => versionInfo.value.version || "unknown");

const title = computed(
  () => versionInfo.value.title || "앱 업데이트가 필요합니다.",
);

const message = computed(
  () =>
    versionInfo.value.message ||
    "최신 버전으로 업데이트 후 다시 실행해 주세요.",
);

/**
 * requestUpdate 처리 함수입니다.
 * @returns {void}
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
