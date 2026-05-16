<!--
@file MobilePromptInput.vue
@description Mobile prompt input wrapper. Mobile keyboard/browser behavior is handled by CSS classes around this wrapper while PromptComposer owns the shared form logic.
-->
<template>
  <PromptComposer v-bind="$attrs" class="mobile-prompt-input" />
</template>

<script setup>
import PromptComposer from "./PromptComposer.vue";

defineOptions({inheritAttrs: false});
</script>
