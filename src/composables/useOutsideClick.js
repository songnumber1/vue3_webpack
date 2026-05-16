/**
 * @file useOutsideClick.js
 * @description Registers a document click listener and runs a callback when the target is outside supplied roots.
 */

import {onBeforeUnmount, onMounted} from 'vue';

function unwrapRoot(root) {
  const value = typeof root === 'function' ? root() : root;
  return value?.value || value;
}

export function useOutsideClick(roots, callback, options = {}) {
  const shouldIgnore = options.shouldIgnore || (() => false);

  function handleClick(event) {
    if (shouldIgnore(event)) return;
    const elements = (Array.isArray(roots) ? roots : [roots])
      .map(unwrapRoot)
      .filter(Boolean);
    if (elements.some((element) => element.contains?.(event.target))) return;
    callback(event);
  }

  onMounted(() => document.addEventListener('click', handleClick));
  onBeforeUnmount(() => document.removeEventListener('click', handleClick));

  return () => document.removeEventListener('click', handleClick);
}
