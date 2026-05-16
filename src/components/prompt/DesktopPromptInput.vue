<!--
@file DesktopPromptInput.vue
@description Desktop prompt input wrapper. Keeps desktop usage separate from mobile keyboard/browser specific layout policies.
-->
<template>
  <PromptComposer v-bind="$attrs" />
</template>

<script setup>
import PromptComposer from "./PromptComposer.vue";

defineOptions({inheritAttrs: false});
</script>
