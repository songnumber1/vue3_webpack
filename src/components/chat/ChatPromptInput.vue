<template>
  <PromptComposer
    ref="composerRef"
    :class="{'mobile-prompt-input': isMobile}"
    @update:model-value="workspaceActions.updateSelectedModel($event)"
    @submit="workspaceActions.submit($event)"
    @focus="workspaceActions.handlePromptFocus()"
    @height-change="workspaceActions.handlePromptResize()"
  />
</template>

<script setup>
/**
 * @file components/chat/ChatPromptInput.vue
 * @description 채팅 prompt 입력 컴포넌트입니다. 상태는 provide된 PROMPT_STATE_KEY를 사용하고, action만 WORKSPACE_ACTIONS_KEY로 호출합니다.
 */

import {computed, inject, ref} from "vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import {
  PROMPT_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
  createEmptyPromptState,
  createEmptyWorkspaceActions,
} from "@/composables/chat/chatActionContext";

const promptState = inject(PROMPT_STATE_KEY, computed(createEmptyPromptState));
const workspaceActions = inject(
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions()
);
const composerRef = ref(null);
const isMobile = computed(() => promptState.value.isMobile);

function setText(value, options) {
  composerRef.value?.setText(value, options);
}

defineExpose({
  setText,
});
</script>
