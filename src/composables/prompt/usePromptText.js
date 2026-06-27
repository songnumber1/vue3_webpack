/**
 * @file composables/prompt/usePromptText.js
 * @description 프롬프트 입력 텍스트 상태와 textarea auto-grow 보조 로직을 관리합니다.
 */

import {computed, nextTick, ref} from "vue";
import {PROMPT_TEXTAREA_HEIGHT} from "@/constants/promptComposer";
import {usePromptControlStore} from "@/stores/promptControlStore";

export function usePromptText({emit, isExpanded}) {
  const promptControlStore = usePromptControlStore();

  const text = computed({
    get: () => promptControlStore.activePromptText,
    set: (value) => {
      promptControlStore.setActivePromptText(value);
    },
  });

  const textareaComponentRef = ref(null);
  let lastHeight = 0;

  const textareaRef = computed(() => {
    const exposed = textareaComponentRef.value;
    const candidate =
      exposed?.textareaRef?.value ||
      exposed?.textareaRef ||
      exposed?.$el ||
      null;

    return candidate && typeof candidate === "object" ? candidate : null;
  });

  const hasPromptText = computed(() => text.value.trim().length > 0);

  function syncTextareaDomValue() {
    const el = textareaRef.value;
    if (!el || typeof el.value !== "string") return;

    const nextValue = text.value || "";
    if (el.value !== nextValue) {
      el.value = nextValue;
    }
  }

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

  function resize() {
    const el = textareaRef.value;
    if (!el) return;

    syncTextareaDomValue();
    if (!isTextareaMeasurable(el)) return;

    if (isExpanded?.value) {
      el.style.height = "100%";
      el.style.maxHeight = "none";
      el.style.overflowY = "auto";

      const expandedHeight = el.offsetHeight || el.clientHeight || 0;
      if (expandedHeight && expandedHeight !== lastHeight) {
        lastHeight = expandedHeight;
        emit("height-change", expandedHeight);
      }
      return;
    }

    el.style.height = "auto";

    const computedStyle = window.getComputedStyle(el);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight);
    const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;
    const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom =
      Number.parseFloat(computedStyle.borderBottomWidth) || 0;
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

    if (nextHeight !== lastHeight) {
      lastHeight = nextHeight;
      emit("height-change", nextHeight);
    }
  }

  function restoreTextareaAutoGrow() {
    const el = textareaRef.value;
    if (!el) return;

    syncTextareaDomValue();
    el.style.height = "auto";
    el.style.maxHeight = "";
    el.style.overflowY = "";
    el.scrollTop = 0;
    el.scrollLeft = 0;
    lastHeight = 0;
    nextTick(resize);
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

  function clearText() {
    text.value = "";

    const el = textareaRef.value;
    if (el && typeof el.value === "string") {
      el.value = "";
    }

    restoreTextareaAutoGrow();
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
    restoreTextareaAutoGrow,
    clearText,
  };
}
