<template>
  <PromptInput
    ref="promptInputRef"
    :is-mobile="isMobile"
    :floating="floating"
    :model-value="selectedModel"
    :models="models"
    :disabled="disabled"
    :model-readonly="modelReadonly"
    :show-help="showHelp"
    @update:model-value="emit('update:selectedModel', $event)"
    @submit="emit('submit', $event)"
    @focus="emit('focus')"
    @height-change="emit('height-change', $event)"
  />
</template>

<script setup>
import {ref} from "vue";
import PromptInput from "@/components/prompt/PromptInput.vue";

defineProps({
  isMobile: {type: Boolean, default: false},
  floating: {type: Boolean, default: false},
  selectedModel: {type: String, default: ""},
  models: {type: Array, default: () => []},
  disabled: {type: Boolean, default: false},
  modelReadonly: {type: Boolean, default: false},
  showHelp: {type: Boolean, default: false},
});

const emit = defineEmits([
  "update:selectedModel",
  "submit",
  "focus",
  "height-change",
]);

const promptInputRef = ref(null);

function setText(value, options) {
  promptInputRef.value?.setText(value, options);
}

defineExpose({
  setText,
});
</script>
