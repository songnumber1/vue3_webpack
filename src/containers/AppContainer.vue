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
import {useRuntimeModeFlags} from "@/composables/useRuntimeModeFlags";

const {appInfo} = useAppContext();
const {platformInfo, shouldUseMobileLayout, isMobileBrowser} = useRuntimeModeFlags();
const platformName = computed(
  () => platformInfo.value.env || appInfo?.platform || "web"
);
const browserName = computed(() => platformInfo.value.browser || "unknown");
const deviceName = computed(() => platformInfo.value.device || "unknown");
const isMobileContainer = computed(() => shouldUseMobileLayout.value);

const containerClasses = computed(() => ({
  "app-container--web": !isMobileContainer.value,
  "app-container--compact": isMobileContainer.value,
  "app-container--compact-browser": isMobileBrowser.value,
  [`app-container--${platformName.value}`]: true,
  [`app-container--browser-${browserName.value}`]: true,
  [`app-container--device-${deviceName.value}`]: true,
}));
</script>
