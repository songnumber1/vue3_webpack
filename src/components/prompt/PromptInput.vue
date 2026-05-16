<template>
  <PromptComposer
    v-bind="$attrs"
    :class="{'mobile-prompt-input': isMobile}"
  />
</template>

<script setup>
import PromptComposer from './PromptComposer.vue';

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
defineOptions({inheritAttrs: false});

defineProps({
  isMobile: {type: Boolean, default: false},
});
</script>
