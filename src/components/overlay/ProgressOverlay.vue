<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-toast flex items-center justify-center bg-white/[.08] backdrop-blur-sm touch-none pointer-events-auto"
      role="status"
      aria-live="polite"
    >
      <span class="size-11 rounded-full border-4 border-black/[.18] border-t-[var(--primary,#10a37f)] animate-spin-fast" aria-hidden="true"></span>
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

const visible = computed(() =>
  Boolean(systemSettingsStore.showMobileApiProgress && isOverlayVisible.value)
);
</script>
