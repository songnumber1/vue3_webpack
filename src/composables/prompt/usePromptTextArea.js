/**
 * @file usePromptTextArea.js
 * @description Textarea state, focus and auto-resize behavior for PromptComposer.
 */

import {computed, nextTick, ref} from 'vue';

/**
 * @param {{disabled: boolean}} props Prompt props.
 * @param {Function} emit Prompt emit function.
 * @returns {object} Textarea controller.
 */
export function usePromptTextArea(props, emit) {
  const text = ref('');
  const textareaComponentRef = ref(null);
  let lastHeight = 0;

  const textareaRef = computed(
    () => textareaComponentRef.value?.textareaRef || null
  );

  /** @returns {void} */
  function resize() {
    const el = textareaRef.value;
    if (!el) return;

    el.style.height = 'auto';
    const maxHeight = window.matchMedia?.('(max-width: 900px)')?.matches
      ? 136
      : 160;
    const nextHeight = Math.min(Math.max(el.scrollHeight, 38), maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';

    if (nextHeight !== lastHeight) {
      lastHeight = nextHeight;
      emit('height-change', nextHeight);
    }
  }

  /** @returns {void} */
  function handleFocus() {
    emit('focus');
    nextTick(resize);
  }

  /** @returns {number} */
  function getLastHeight() {
    return lastHeight;
  }

  /** @returns {void} */
  function focusTextarea() {
    textareaRef.value?.focus();
  }

  /** @returns {void} */
  function resetText() {
    text.value = '';
    nextTick(resize);
  }

  return {
    text,
    textareaComponentRef,
    textareaRef,
    resize,
    handleFocus,
    focusTextarea,
    resetText,
    getLastHeight,
  };
}
