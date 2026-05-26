<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="mobile-api-progress-overlay"
      role="status"
      aria-live="polite"
    >
      <span class="mobile-api-progress-spinner" aria-hidden="true"></span>
      <span class="sr-only">{{ t("overlayProgress.apiProcessing") }}</span>
    </div>
  </teleport>
</template>

<script setup>
/**
 * @file components/overlay/MobileApiProgressOverlay.vue
 * @description 재사용 UI 컴포넌트입니다. 화면 상태는 상위 props/action에서 받고 내부에서는 렌더와 사용자 이벤트만 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {usePlatformStore} from "@/stores/platformStore";
import {isMobileLikeViewport} from "@/platform/viewport/viewportMode";

const {t} = useI18n();
const apiRequestStore = useApiRequestStore();
const systemSettingsStore = useSystemSettingsStore();
const platformStore = usePlatformStore();
const {isOverlayVisible} = storeToRefs(apiRequestStore);

const visible = computed(() => {
  const info = platformStore.info || {};
  const isActualMobilePlatform = info.isPlatformForced
    ? info.actualEnv === "android" && info.actualRuntime !== "native"
    : info.isMobile;
  const isMobile =
    isMobileLikeViewport(systemSettingsStore.mobileBreakpoint) ||
    isActualMobilePlatform;
  return Boolean(
    isMobile &&
    systemSettingsStore.showMobileApiProgress &&
    isOverlayVisible.value
  );
});
</script>
