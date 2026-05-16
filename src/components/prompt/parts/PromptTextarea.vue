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

const textareaRef = ref(null);

defineProps({
  modelValue: {type: String, default: ''},
  disabled: {type: Boolean, default: false},
  placeholder: {type: String, default: ''},
});

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'input', 'submit', 'paste']);

/**
 * Emits the latest textarea value and forwards the input event to the parent for autosize calculation.
 * @param {InputEvent} event Browser input event.
 * @returns {void}
 */
function handleInput(event) {
  emit('update:modelValue', event.target.value);
  emit('input', event);
}

defineExpose({textareaRef});
</script>
