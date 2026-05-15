<!--
@file AppShell.vue
@description Backward-compatible wrapper. Use containers/AppContainer.vue for new code.
-->

<template>
  <AppContainer>
    <slot />
  </AppContainer>
</template>

<script setup>
import AppContainer from "@/containers/AppContainer.vue";
</script>
