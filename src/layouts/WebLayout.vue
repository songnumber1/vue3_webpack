<!--
@file WebLayout.vue
@description Backward-compatible layout wrapper. New code should use AppContainer via resolveLayout().
-->

<template>
  <AppContainer>
    <slot />
  </AppContainer>
</template>

<script setup>
import AppContainer from "@/containers/AppContainer.vue";
</script>
