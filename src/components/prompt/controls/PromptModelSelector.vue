<template>
  <div ref="modelRoot" class="prompt-selector-wrap tw-min-w-0">
    <button
      class="prompt-model-trigger"
      type="button"
      :disabled="disabled || modelReadonly"
      :title="modelReadonly ? readonlyTitle : undefined"
      :aria-label="modelSelectLabel"
      @click="$emit('open-model')"
    >
      <span class="tw-min-w-0">{{ currentModel.label }}</span>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M5.5 7.5 10 12l4.5-4.5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <PromptModelFloatMenu
      :open="modelMenuOpen && !isMobileSheet"
      :model-value="modelValue"
      :models="models"
      @select-model="$emit('select-model', $event)"
    />
  </div>
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptModelSelector.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 */

import {ref} from "vue";
import PromptModelFloatMenu from "@/components/prompt/model/desktop/PromptModelFloatMenu.vue";

const modelRoot = ref(null);

defineProps({
  disabled: {type: Boolean, default: false},
  modelReadonly: {type: Boolean, default: false},
  modelValue: {type: String, default: ""},
  currentModel: {type: Object, required: true},
  models: {type: Array, default: () => []},
  modelMenuOpen: {type: Boolean, default: false},
  isMobileSheet: {type: Boolean, default: false},
  modelSelectLabel: {type: String, default: "Select model"},
  readonlyTitle: {type: String, default: ""},
});

defineEmits(["open-model", "select-model"]);

defineExpose({modelRoot});
</script>
