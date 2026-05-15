<!--
@file AppShell.vue
@description Unified application shell that replaces platform-only WebLayout/AndroidLayout slot wrappers.
-->

<template>
  <div class="app-shell" :class="shellClasses" :data-platform="platformName">
    <slot />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useAppContext } from "@/composables/useAppContext";
import { isAndroidApp } from "@/core/config";

const { appInfo } = useAppContext();

const platformName = computed(() => appInfo?.platform || "web");

const shellClasses = computed(() => ({
  "app-shell--web": !isAndroidApp(appInfo),
  "app-shell--mobile": isAndroidApp(appInfo),
  [`app-shell--${platformName.value}`]: true,
}));
</script>
