/**
 * @file useCssVariableSize.js
 * @description Observes an element size and writes it to a CSS custom property.
 */

import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue';

/**
 * @param {{propertyName: string, minValue?: number, getValue?: Function}} options Observer options.
 * @returns {{targetRef: import('vue').Ref<HTMLElement|null>, updateCssVariable: Function}}
 */
export function useCssVariableSize(options) {
  const targetRef = ref(null);
  let resizeObserver = null;

  /** @returns {number} */
  function resolveElement() {
    return targetRef.value?.$el || targetRef.value || null;
  }

  function resolveValue() {
    const element = resolveElement();
    if (typeof options.getValue === 'function') {
      return options.getValue(element);
    }
    return element?.offsetHeight || 0;
  }

  /** @returns {void} */
  function updateCssVariable() {
    const value = Math.max(resolveValue(), options.minValue || 0);
    document.documentElement.style.setProperty(
      options.propertyName,
      `${value}px`
    );
  }

  /** @returns {void} */
  function observeTarget() {
    const element = resolveElement();
    if (!element) return;
    updateCssVariable();
    if (typeof ResizeObserver === 'undefined') return;
    resizeObserver = new ResizeObserver(updateCssVariable);
    resizeObserver.observe(element);
  }

  /** @returns {void} */
  function cleanupObserver() {
    resizeObserver?.disconnect();
    resizeObserver = null;
  }

  onMounted(async () => {
    await nextTick();
    observeTarget();
  });

  onBeforeUnmount(cleanupObserver);

  return {targetRef, updateCssVariable};
}
