/**
 * @file composables/prompt/usePromptText.js
 * @description 프롬프트 입력 텍스트 상태를 관리합니다. textarea DOM auto-grow는 PromptTextarea.vue가 전담합니다.
 */

import {computed, nextTick, ref} from "vue";
import {usePromptControlStore} from "@/stores/promptControlStore";

export function usePromptText({emit}) {
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

  function resolveTextareaController() {
    const exposed = textareaComponentRef.value;
    return exposed && typeof exposed === "object" ? exposed : null;
  }

  function emitHeightChange(nextHeight) {
    if (!Number.isFinite(nextHeight) || nextHeight === lastHeight) return;
    lastHeight = nextHeight;
    emit("height-change", nextHeight);
  }

  function resize() {
    syncTextareaDomValue();

    const controller = resolveTextareaController();
    const nextHeight = controller?.resizeTextarea?.();

    if (Number.isFinite(nextHeight)) {
      emitHeightChange(nextHeight);
      return;
    }

    const fallbackHeight = controller?.getTextareaHeight?.();
    if (Number.isFinite(fallbackHeight)) {
      emitHeightChange(fallbackHeight);
    }
  }

  function restoreTextareaAutoGrow() {
    syncTextareaDomValue();

    const controller = resolveTextareaController();
    controller?.resetTextareaAutoGrow?.();

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
    const controller = resolveTextareaController();
    if (typeof controller?.focusTextarea === "function") {
      controller.focusTextarea();
      return;
    }
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
