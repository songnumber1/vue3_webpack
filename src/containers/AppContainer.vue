<template>
  <div
    class="app-container"
    :class="containerClasses"
    :data-platform="platformName"
  >
    <slot />
  </div>
</template>

<script setup>
import {computed} from "vue";
import {useAppContext} from "@/composables/useAppContext";
import {usePlatformStore} from "@/stores/platformStore";

const {appInfo} = useAppContext();
const platformStore = usePlatformStore();

const platformInfo = computed(() => platformStore.info || {});
const platformName = computed(
  () => platformInfo.value.env || appInfo?.platform || "web"
);
const browserName = computed(() => platformInfo.value.browser || "unknown");
const deviceName = computed(() => platformInfo.value.device || "unknown");
const isMobileContainer = computed(
  () =>
    platformInfo.value.isMobileBrowser ||
    platformInfo.value.isAndroidApp ||
    platformInfo.value.isIosApp
);

const containerClasses = computed(() => ({
  "app-container--web": !isMobileContainer.value,
  "app-container--mobile": isMobileContainer.value,
  "app-container--mobile-browser": Boolean(platformInfo.value.isMobileBrowser),
  [`app-container--${platformName.value}`]: true,
  [`app-container--browser-${browserName.value}`]: true,
  [`app-container--device-${deviceName.value}`]: true,
}));
</script>

<style scoped>
/* Component-local styles should stay scoped. */
</style>
