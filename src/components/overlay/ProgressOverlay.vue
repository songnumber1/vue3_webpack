<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="mobile-api-progress-overlay tw-fixed tw-inset-0 tw-z-appDialogFront tw-grid tw-place-items-center tw-bg-white/10 tw-backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
    >
      <span class="mobile-api-progress-spinner tw-inline-flex tw-h-11 tw-w-11 tw-animate-spin tw-rounded-full tw-border-4 tw-border-solid tw-border-slate-900/20 tw-border-t-app-primary" aria-hidden="true"></span>
      <span class="sr-only">{{ t("overlayProgress.apiProcessing") }}</span>
    </div>
  </teleport>
</template>

<script setup>
/**
 * @file components/overlay/ProgressOverlay.vue
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

const {t} = useI18n();
const apiRequestStore = useApiRequestStore();
const systemSettingsStore = useSystemSettingsStore();
const {isOverlayVisible} = storeToRefs(apiRequestStore);

// API 진행 표시 설정은 일반 HTTP/SSE 요청뿐 아니라 채팅방 이력 hydration처럼
// 직접 startOverlay()로 보호하는 화면 전환 작업에도 동일하게 적용합니다.
// 사용자가 시스템 설정에서 끄면 activeOverlayCount가 남아 있어도 화면에는
// circle progress가 절대 렌더링되지 않습니다.
const visible = computed(
  () => Boolean(systemSettingsStore.showMobileApiProgress) && Boolean(isOverlayVisible.value)
);
</script>
