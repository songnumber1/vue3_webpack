import {computed, nextTick, ref} from "vue";
import {PROMPT_TEXTAREA_HEIGHT} from "@/constants/promptComposer";

/**
 * @description 텍스트 입력, textarea 리사이즈, 포커스, 붙여넣기를 처리합니다.
 * @param {object} options - isMobileSheet ref, emit 함수
 * @returns {object} text 상태, resize, handleFocus, handlePaste, hasPromptText, refs
 */
export function usePromptText({isMobileSheet, emit}) {
  const text = ref("");
  const textareaComponentRef = ref(null);
  let lastHeight = 0;

  const textareaRef = computed(
    () => textareaComponentRef.value?.textareaRef || null
  );

  const hasPromptText = computed(() => text.value.trim().length > 0);

  function resize() {
    const el = textareaRef.value;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = isMobileSheet.value
      ? PROMPT_TEXTAREA_HEIGHT.mobileMax
      : PROMPT_TEXTAREA_HEIGHT.desktopMax;
    const nextHeight = Math.min(
      Math.max(el.scrollHeight, PROMPT_TEXTAREA_HEIGHT.min),
      maxHeight
    );
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    if (nextHeight !== lastHeight) {
      lastHeight = nextHeight;
      emit("height-change", nextHeight);
    }
  }

  function handleFocus() {
    emit("focus");
    nextTick(resize);
  }

  function handlePaste(event) {
    const files = Array.from(event.clipboardData?.files || []);
    if (!files.length) return;
    return files;
  }

  function getLastHeight() {
    return lastHeight;
  }

  function focusTextarea() {
    textareaRef.value?.focus();
  }

  return {
    text,
    textareaComponentRef,
    textareaRef,
    hasPromptText,
    resize,
    handleFocus,
    handlePaste,
    getLastHeight,
    focusTextarea,
  };
}
