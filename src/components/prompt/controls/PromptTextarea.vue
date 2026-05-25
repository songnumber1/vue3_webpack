<template>
  <textarea
    ref="textareaRef"
    :value="modelValue"
    :disabled="disabled"
    :placeholder="placeholder"
    rows="1"
    @focus="$emit('focus')"
    @blur="$emit('blur')"
    @input="handleInput"
    @keydown.enter.exact.prevent="$emit('submit')"
    @paste="$emit('paste', $event)"
  />
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptTextarea.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {ref} from "vue";

const textareaRef = ref(null);

defineProps({
  modelValue: {type: String, default: ""},
  disabled: {type: Boolean, default: false},
  placeholder: {type: String, default: ""},
});

const emit = defineEmits([
  "update:modelValue",
  "focus",
  "blur",
  "input",
  "submit",
  "paste",
]);
/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function handleInput(event) {
  emit("update:modelValue", event.target.value);
  emit("input", event);
}

defineExpose({textareaRef});
</script>

<style scoped>
.prompt-textarea {
  min-width: 0;
}
</style>
