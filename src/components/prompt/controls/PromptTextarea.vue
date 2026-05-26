<template>
  <textarea
    ref="textareaRef"
    class="prompt-textarea"
    :value="textareaValue"
    :disabled="isDisabled"
    :placeholder="resolvedPlaceholder"
    rows="1"
    @focus="$emit('focus')"
    @blur="$emit('blur')"
    @input="handleInput"
    @keydown.enter.exact.prevent="handleEnterSubmit"
    @keydown.shift.enter="handleShiftEnter"
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

import {computed, inject, nextTick, ref} from "vue";
import {
  PROMPT_TEXTAREA_STATE_KEY,
} from "@/composables/chat/chatActionContext";

const textareaRef = ref(null);
const localText = ref("");

const textareaState = inject(PROMPT_TEXTAREA_STATE_KEY, null);
const textareaValue = computed(() => textareaState?.text?.value ?? localText.value);
const resolvedPlaceholder = computed(() => textareaState?.placeholder?.value || "");
const isDisabled = computed(() => Boolean(textareaState?.disabled?.value));
const isGenerating = computed(() => Boolean(textareaState?.generating?.value));
const canSubmit = computed(() => Boolean(textareaState?.canSubmit?.value));

const emit = defineEmits([
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
  if (textareaState?.text) {
    textareaState.text.value = event.target.value;
  } else {
    localText.value = event.target.value;
  }
  emit("input", event);
}

/**
 * Enter 단독 입력은 전송 단축키입니다. 답변 생성 중이거나 전송 조건이 맞지 않을 때는
 * textarea는 활성 상태로 유지하되 submit 이벤트만 상위로 올리지 않습니다.
 */
function handleEnterSubmit() {
  if (isDisabled.value || isGenerating.value || !canSubmit.value) return;
  emit("submit");
}

/**
 * Shift+Enter는 브라우저 기본 개행을 유지하고, DOM 값 반영 이후 높이를 다시 계산합니다.
 */
function handleShiftEnter(event) {
  nextTick(() => emit("input", event));
}

defineExpose({textareaRef});
</script>

<style scoped>
.prompt-textarea {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 38px;
  flex: 0 0 auto;
}
</style>
