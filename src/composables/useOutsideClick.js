import {useEventListener} from "@vueuse/core";

function unwrapRoot(root) {
  const value = typeof root === "function" ? root() : root;
  return value?.value || value;
}

function isEventInsideElement(event, element) {
  if (!element) return false;
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  if (path.length && path.includes(element)) return true;
  return element.contains?.(event.target) || false;
}

/**
 * @description 지정한 root 외부 pointerdown 시 callback을 실행합니다.
 * @param {*} roots - 단일 root 또는 root 배열입니다.
 * @param {Function} callback - 외부 클릭 콜백입니다.
 * @param {Object} options - shouldIgnore 옵션을 지원합니다.
 * @returns {Function} 이벤트 정리 함수입니다.
 */
export function useOutsideClick(roots, callback, options = {}) {
  const shouldIgnore = options.shouldIgnore || (() => false);
  const eventName = options.eventName || "pointerdown";

  function handleOutsideEvent(event) {
    if (shouldIgnore(event)) return;

    const elements = (Array.isArray(roots) ? roots : [roots])
      .map(unwrapRoot)
      .filter(Boolean);

    if (elements.some((element) => isEventInsideElement(event, element))) return;
    callback(event);
  }

  return useEventListener(document, eventName, handleOutsideEvent, {
    capture: true,
    passive: true,
  });
}
