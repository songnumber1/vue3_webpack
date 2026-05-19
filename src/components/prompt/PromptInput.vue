<template>
  <PromptComposer v-bind="$attrs" :class="{'mobile-prompt-input': isMobile}" />
</template>

<script setup>
import PromptComposer from "./PromptComposer.vue";

defineOptions({inheritAttrs: false});

defineProps({
  isMobile: {type: Boolean, default: false},
});
</script>

<style scoped>
/* Component-local styles should stay scoped. */
</style>
