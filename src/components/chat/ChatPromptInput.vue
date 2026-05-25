<template>
  <PromptComposer
    ref="composerRef"
    :class="{'mobile-prompt-input': isMobile}"
    :floating="floating"
    :model-value="selectedModel"
    :models="models"
    :disabled="disabled"
    :generating="generating"
    :model-readonly="modelReadonly"
    :show-help="showHelp"
    @update:model-value="workspaceActions.updateSelectedModel($event)"
    @submit="workspaceActions.submit($event)"
    @focus="workspaceActions.handlePromptFocus()"
    @height-change="workspaceActions.handlePromptResize()"
  />
</template>

<script setup>
/**
 * @file components/chat/ChatPromptInput.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {inject, ref} from "vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import {
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions,
} from "@/composables/chat/chatActionContext";

defineProps({
  isMobile: {type: Boolean, default: false},
  floating: {type: Boolean, default: false},
  selectedModel: {type: String, default: ""},
  models: {type: Array, default: () => []},
  disabled: {type: Boolean, default: false},
  generating: {type: Boolean, default: false},
  modelReadonly: {type: Boolean, default: false},
  showHelp: {type: Boolean, default: false},
});

const workspaceActions = inject(
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions()
);
const composerRef = ref(null);

/**
 * store, DOM CSS 변수 또는 reactive 상태에 값을 반영합니다.
 */
function setText(value, options) {
  composerRef.value?.setText(value, options);
}

defineExpose({
  setText,
});
</script>
