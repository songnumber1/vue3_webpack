<template>
  <textarea
    ref="textareaRef"
    class="prompt-textarea tw-block tw-w-full tw-min-w-0 tw-min-h-[38px] tw-flex-none tw-resize-none tw-border-0 tw-bg-transparent tw-text-app-text tw-outline-none placeholder:tw-text-app-placeholder"
    :class="{'prompt-textarea--expanded': isExpanded}"
    :value="textareaValue"
    :disabled="isDisabled"
    :placeholder="resolvedPlaceholder"
    rows="1"
    @focus="promptInputActions.focus?.()"
    @blur="promptInputActions.blur?.()"
    @input="handleInput"
    @compositionstart="handleCompositionStart"
    @compositionend="handleCompositionEnd"
    @keydown.enter.exact="handleEnterSubmit"
    @keydown.shift.enter="handleShiftEnter"
    @keydown.ctrl.enter.prevent="handleModifiedEnterSubmit"
    @keydown.meta.enter.prevent="handleModifiedEnterSubmit"
    @paste="promptInputActions.paste?.($event)"
  />
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptTextarea.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 */

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  inject,
  watch,
} from "vue";
import {PROMPT_TEXTAREA_STATE_KEY} from "@/composables/chat/chatStateContext";
import {usePromptInputActions} from "@/composables/prompt/context/promptInputActionContext";
import {PROMPT_TEXTAREA_HEIGHT} from "@/constants/promptComposer";

const textareaRef = ref(null);
const localText = ref("");
const isComposing = ref(false);
let applyFrame = 0;
let lastHeight = 0;

const textareaState = inject(PROMPT_TEXTAREA_STATE_KEY, null);
const promptInputActions = usePromptInputActions();
const textareaValue = computed(
  () => textareaState?.text?.value ?? localText.value
);
const resolvedPlaceholder = computed(
  () => textareaState?.placeholder?.value || ""
);
const isDisabled = computed(() => Boolean(textareaState?.disabled?.value));
const isGenerating = computed(() => Boolean(textareaState?.generating?.value));
const canSubmit = computed(() => Boolean(textareaState?.canSubmit?.value));
const isExpanded = computed(() => Boolean(textareaState?.expanded?.value));


function isTextareaMeasurable(el) {
  if (!el || typeof window === "undefined") return false;

  const rect = el.getBoundingClientRect?.();
  const style = window.getComputedStyle(el);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect &&
    rect.width > 0
  );
}

function resizeTextareaElement() {
  const el = textareaRef.value;
  if (!el || !isTextareaMeasurable(el)) return lastHeight;

  if (isExpanded.value) {
    el.style.height = "100%";
    el.style.maxHeight = "none";
    el.style.overflowY = "auto";
    lastHeight = el.offsetHeight || el.clientHeight || lastHeight || 0;
    return lastHeight;
  }

  el.style.height = "auto";

  const computedStyle = window.getComputedStyle(el);
  const lineHeight = Number.parseFloat(computedStyle.lineHeight);
  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
  const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth) || 0;
  const resolvedLineHeight = Number.isFinite(lineHeight)
    ? lineHeight
    : PROMPT_TEXTAREA_HEIGHT.lineHeight;
  const resolvedMaxRows = Math.max(
    Number.parseInt(PROMPT_TEXTAREA_HEIGHT.maxRows, 10) || 1,
    1
  );
  const maxHeight =
    resolvedLineHeight * resolvedMaxRows +
    paddingTop +
    paddingBottom +
    borderTop +
    borderBottom;
  const nextHeight = Math.min(
    Math.max(el.scrollHeight, PROMPT_TEXTAREA_HEIGHT.min),
    maxHeight
  );

  el.style.maxHeight = `${maxHeight}px`;
  el.style.height = `${nextHeight}px`;
  el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  lastHeight = nextHeight;
  return nextHeight;
}

function resetTextareaAutoGrow() {
  const el = textareaRef.value;
  if (!el) return lastHeight;

  el.style.height = "auto";
  el.style.maxHeight = "";
  el.style.overflowY = "";
  el.scrollTop = 0;
  el.scrollLeft = 0;
  lastHeight = 0;
  nextTick(resizeTextareaElement);
  return lastHeight;
}

function getTextareaHeight() {
  return lastHeight;
}

function focusTextarea() {
  textareaRef.value?.focus();
}

function emitInputAfterDomSync() {
  const el = textareaRef.value;
  if (!el) return;

  resizeTextareaElement();
  promptInputActions.input?.({target: el});
}

function applyStateValueToDom() {
  const el = textareaRef.value;
  if (!el) return;

  const nextValue = textareaValue.value || "";
  if (el.value !== nextValue) {
    el.value = nextValue;
  }

  emitInputAfterDomSync();
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */

function cancelScheduledApplyStateValueToDom() {
  if (typeof window === "undefined" || !applyFrame) return;

  window.cancelAnimationFrame(applyFrame);
  applyFrame = 0;
}

function scheduleApplyStateValueToDom() {
  cancelScheduledApplyStateValueToDom();

  nextTick(() => {
    if (typeof window === "undefined") {
      applyStateValueToDom();
      return;
    }

    applyFrame = window.requestAnimationFrame(() => {
      applyFrame = 0;
      applyStateValueToDom();
    });
  });
}

function handleInput(event) {
  if (event?.isComposing || isComposing.value) return;

  if (textareaState?.text) {
    textareaState.text.value = event.target.value;
  } else {
    localText.value = event.target.value;
  }

  // 실제 입력 이벤트가 발생한 textarea DOM을 기준으로 먼저 높이를 맞춥니다.
  // 반응형 전환 후 기존 값이 있는 상태에서 이어 입력하는 경우에도
  // 부모/store 동기화 타이밍과 무관하게 auto-grow가 즉시 동작해야 합니다.
  resizeTextareaElement();
  promptInputActions.input?.(event);
}

/**
 * IME 조합 중에는 Enter가 글자 확정 용도로 사용될 수 있으므로 전송하지 않습니다.
 * 조합 종료 시점에는 최종 DOM 값을 상태에 즉시 반영해 전송 후 마지막 글자가 남는 현상을 방지합니다.
 */
function handleCompositionStart() {
  isComposing.value = true;
}

function handleCompositionEnd(event) {
  isComposing.value = false;
  handleInput(event);
}

/**
 * Enter 단독 입력은 기본 상태에서는 전송 단축키입니다.
 * 최대화 상태에서는 긴 글 작성 흐름을 우선하여 브라우저 기본 개행을 유지합니다.
 */
function handleEnterSubmit(event) {
  if (event?.isComposing || isComposing.value) return;

  if (isExpanded.value) {
    nextTick(emitInputAfterDomSync);
    return;
  }

  event?.preventDefault?.();
  submitFromKeyboard();
}

/**
 * 최대화 상태의 전송 단축키입니다. 긴 글 작성 중 실수 전송을 줄이기 위해
 * Enter는 개행으로 두고 Ctrl/⌘+Enter만 전송으로 처리합니다.
 */
function handleModifiedEnterSubmit(event) {
  if (event?.isComposing || isComposing.value) return;

  submitFromKeyboard();
}

function submitFromKeyboard() {
  if (isDisabled.value || isGenerating.value || !canSubmit.value) return;

  promptInputActions.submit?.();
}

/**
 * Shift+Enter는 브라우저 기본 개행을 유지하고, DOM 값 반영 이후 높이를 다시 계산합니다.
 */
function handleShiftEnter() {
  nextTick(emitInputAfterDomSync);
}

watch(() => textareaState?.layoutMode?.value, scheduleApplyStateValueToDom, {
  flush: "post",
});

watch(textareaValue, scheduleApplyStateValueToDom, {flush: "post"});

watch(isExpanded, scheduleApplyStateValueToDom, {flush: "post"});

onMounted(() => {
  scheduleApplyStateValueToDom();
});

onBeforeUnmount(() => {
  cancelScheduledApplyStateValueToDom();
});

defineExpose({
  textareaRef,
  resizeTextarea: resizeTextareaElement,
  resetTextareaAutoGrow,
  getTextareaHeight,
  focusTextarea,
});
</script>
