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
import {ref} from 'vue';

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const textareaRef = ref(null);

defineProps({
  modelValue: {type: String, default: ''},
  disabled: {type: Boolean, default: false},
  placeholder: {type: String, default: ''},
});

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'input', 'submit', 'paste']);

/**
 * @description handleInput 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} event - event 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function handleInput(event) {
  emit('update:modelValue', event.target.value);
  emit('input', event);
}

defineExpose({textareaRef});
</script>
