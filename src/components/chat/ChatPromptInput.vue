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

function setText(value, options) {
  composerRef.value?.setText(value, options);
}

defineExpose({
  setText,
});
</script>
