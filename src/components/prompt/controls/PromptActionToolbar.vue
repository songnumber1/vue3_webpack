<template>
  <component
    :is="resolvedToolbarComponent"
    ref="toolbarComponentRef"
    @open-model="$emit('open-model')"
    @open-tool="$emit('open-tool')"
    @open-attach="$emit('open-attach')"
    @select-model="$emit('select-model', $event)"
    @apply-tool="$emit('apply-tool', $event)"
    @open-file-picker="$emit('open-file-picker', $event)"
    @start-voice="$emit('start-voice')"
    @stop-voice="$emit('stop-voice')"
  />
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptActionToolbar.vue
 * @description 데스크톱/모바일 툴바를 선택합니다. 렌더 상태는 PROMPT_TOOLBAR_STATE_KEY로 공유합니다.
 */

import {computed, inject, ref} from "vue";
import PromptToolbarDesktop from "@/components/prompt/controls/PromptToolbarDesktop.vue";
import PromptToolbarMobile from "@/components/prompt/controls/PromptToolbarMobile.vue";
import {
  PROMPT_TOOLBAR_STATE_KEY,
  createEmptyPromptToolbarState,
} from "@/composables/chat/chatActionContext";

defineEmits([
  "open-model",
  "open-tool",
  "open-attach",
  "select-model",
  "apply-tool",
  "open-file-picker",
  "start-voice",
  "stop-voice",
]);

const toolbarState = inject(
  PROMPT_TOOLBAR_STATE_KEY,
  computed(createEmptyPromptToolbarState)
);
const toolbarComponentRef = ref(null);
const resolvedToolbarComponent = computed(() =>
  toolbarState.value.isMobileSheet ? PromptToolbarMobile : PromptToolbarDesktop
);

const modelRoot = computed(() => toolbarComponentRef.value?.modelRoot || null);
const toolRoot = computed(() => toolbarComponentRef.value?.toolRoot || null);
const attachRoot = computed(
  () => toolbarComponentRef.value?.attachRoot || null
);

defineExpose({modelRoot, toolRoot, attachRoot});
</script>
