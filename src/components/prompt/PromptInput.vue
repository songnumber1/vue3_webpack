<template>
  <PromptComposer
    ref="composerRef"
    v-bind="$attrs"
    :class="{'mobile-prompt-input': isMobile}"
  />
</template>

<script setup>
import {ref} from "vue";
import PromptComposer from "./PromptComposer.vue";

defineOptions({inheritAttrs: false});

const composerRef = ref(null);

defineProps({
  isMobile: {type: Boolean, default: false},
});

function setText(value, options) {
  composerRef.value?.setText(value, options);
}

defineExpose({
  setText,
});
</script>

<style scoped>
.prompt-input {
  min-width: 0;
}
</style>
