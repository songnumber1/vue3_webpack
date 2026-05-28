<template>
  <div ref="modelRoot" class="prompt-selector-wrap">
    <button
      class="prompt-model-trigger"
      type="button"
      :disabled="disabled || modelReadonly"
      :title="modelReadonly ? readonlyTitle : undefined"
      :aria-label="modelSelectLabel"
      @click="$emit('open-model')"
    >
      <span>{{ currentModel.label }}</span>
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
    <div
      v-if="modelMenuOpen && !isMobileSheet"
      class="prompt-popover model-menu prompt-model-menu"
    >
      <button
        v-for="model in models"
        :key="model.id"
        class="model-option"
        :class="{active: model.id === modelValue}"
        type="button"
        @click="$emit('select-model', model.id)"
      >
        <span class="model-option-main">
          <strong>{{ model.label }}</strong>
          <small>{{ model.description }}</small>
        </span>
        <CheckIcon v-if="model.id === modelValue" class="option-check" />
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptModelSelector.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {ref} from "vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";

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

<style scoped lang="scss">
.prompt-selector-wrap {
  min-width: 0;
}

.prompt-model-trigger span,
.model-option-main {
  min-width: 0;
}

.prompt-popover {
  box-sizing: border-box;
}
</style>
