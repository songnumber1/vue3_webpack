<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="mobile-api-progress-overlay tw-fixed tw-inset-0 tw-z-appDialogFront tw-grid tw-place-items-center tw-bg-white/10 tw-backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
    >
      <span
        class="mobile-api-progress-spinner tw-inline-flex tw-h-11 tw-w-11 tw-animate-spin tw-rounded-full tw-border-4 tw-border-solid tw-border-slate-900/20 tw-border-t-app-primary"
        aria-hidden="true"
      ></span>
      <span class="sr-only">{{ t("overlayProgress.apiProcessing") }}</span>
    </div>
  </teleport>
</template>

<script setup>
/**
 * @file components/overlay/ProgressOverlay.vue
 * @description 재사용 UI 컴포넌트입니다. 화면 상태는 상위 props/action에서 받고 내부에서는 렌더와 사용자 이벤트만 처리합니다.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {usePlatformStore} from "@/stores/platformStore";
import {isProgressAllowedForCurrentPlatform} from "@/composables/progress/progressPolicy";

const {t} = useI18n();
const apiRequestStore = useApiRequestStore();
const systemSettingsStore = useSystemSettingsStore();
const platformStore = usePlatformStore();
const {isOverlayVisible} = storeToRefs(apiRequestStore);

// ProgressBar는 코드가 startOverlay()로 명시적으로 요청한 경우에만 표시 후보가 됩니다.
// 실제 표시 여부는 화면 너비가 아니라 강제 플랫폼 설정이 반영된 플랫폼 기준의
// PC/Mobile ProgressBar 설정값으로 최종 결정합니다.
const visible = computed(
  () =>
    Boolean(isOverlayVisible.value) &&
    isProgressAllowedForCurrentPlatform(
      systemSettingsStore.settings,
      platformStore.info
    )
);
</script>
