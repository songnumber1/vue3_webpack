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
import {computed} from "vue";
import {useAppContext} from "@/composables/useAppContext";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const {appInfo, bridge} = useAppContext();

const versionInfo = computed(() => appInfo.lastVersionInfo || {});

const currentVersion = computed(() => appInfo.appVersion || "unknown");

const latestVersion = computed(() => versionInfo.value.version || "unknown");

const title = computed(
  () => versionInfo.value.title || "앱 업데이트가 필요합니다."
);

const message = computed(
  () =>
    versionInfo.value.message || "최신 버전으로 업데이트 후 다시 실행해 주세요."
);

/**
 * @description requestUpdate 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function requestUpdate() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof bridge?.openMarket === "function") {
    bridge.openMarket();
    return;
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window.AndroidBridge?.openMarket === "function") {
    window.AndroidBridge.openMarket();
  }
}
</script>
