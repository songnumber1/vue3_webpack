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
