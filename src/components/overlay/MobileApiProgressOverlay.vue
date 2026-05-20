<template>
  <teleport to="body">
    <div v-if="visible" class="mobile-api-progress-overlay" role="status" aria-live="polite">
      <span class="mobile-api-progress-spinner" aria-hidden="true"></span>
      <span class="sr-only">API 요청 처리 중입니다.</span>
    </div>
  </teleport>
</template>

<script setup>
import {computed} from "vue";
import {storeToRefs} from "pinia";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {usePlatformStore} from "@/stores/platformStore";
import {isMobileLikeViewport} from "@/utils/viewportMode";

const apiRequestStore = useApiRequestStore();
const systemSettingsStore = useSystemSettingsStore();
const platformStore = usePlatformStore();
const {isOverlayVisible} = storeToRefs(apiRequestStore);

const visible = computed(() => {
  const isMobile = isMobileLikeViewport(systemSettingsStore.mobileBreakpoint) || platformStore.info?.isMobile;
  return Boolean(isMobile && systemSettingsStore.showMobileApiProgress && isOverlayVisible.value);
});
</script>
