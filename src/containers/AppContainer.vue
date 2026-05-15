<!--
@file AppContainer.vue
@description Root application container that applies platform classes and hosts routed content.
-->

<template>
  <div class="app-container app-shell" :class="containerClasses" :data-platform="platformName">
    <slot />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useAppContext } from "@/composables/useAppContext";
import { isAndroidApp } from "@/core/config";

const { appInfo } = useAppContext();

const platformName = computed(() => appInfo?.platform || "web");
const isMobileContainer = computed(() => isAndroidApp(appInfo));

const containerClasses = computed(() => ({
  "app-container--web": !isMobileContainer.value,
  "app-container--mobile": isMobileContainer.value,
  "app-shell--web": !isMobileContainer.value,
  "app-shell--mobile": isMobileContainer.value,
  [`app-container--${platformName.value}`]: true,
  [`app-shell--${platformName.value}`]: true,
}));
</script>
