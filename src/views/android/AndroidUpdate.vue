<template>
  <main class="exception-page">
    <section class="exception-card">
      <p class="exception-code">{{ t("androidUpdate.label") }}</p>
      <h1 class="exception-title">{{ title }}</h1>
      <p class="exception-description">{{ message }}</p>
      <div class="exception-info-list">
        <div class="exception-info-item">
          <span class="exception-info-label">{{ t("androidUpdate.currentVersion") }}</span>
          <strong class="exception-info-value">{{ currentVersion }}</strong>
        </div>
        <div class="exception-info-item">
          <span class="exception-info-label">{{ t("androidUpdate.latestVersion") }}</span>
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
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useAppContext} from "@/composables/useAppContext";

const {appInfo, bridge} = useAppContext();
const {t} = useI18n();

const versionInfo = computed(() => appInfo.lastVersionInfo || {});
const currentVersion = computed(() => appInfo.appVersion || "unknown");
const latestVersion = computed(() => versionInfo.value.version || "unknown");
const title = computed(() => versionInfo.value.title || t("androidUpdate.defaultTitle"));
const message = computed(() => versionInfo.value.message || t("androidUpdate.defaultMessage"));

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
