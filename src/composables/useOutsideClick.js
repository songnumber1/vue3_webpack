import {useEventListener} from "@vueuse/core";

/**
 * @description root getter/ref를 실제 DOM element로 변환합니다.
 * @param {*} root - 단일 root, ref, getter입니다.
 * @returns {*} 실제 DOM element를 반환합니다.
 */
function unwrapRoot(root) {
  const value = typeof root === "function" ? root() : root;
  return value?.value || value;
}

/**
 * @description 지정한 root 외부 클릭 시 callback을 실행합니다.
 * @param {*} roots - 단일 root 또는 root 배열입니다.
 * @param {Function} callback - 외부 클릭 콜백입니다.
 * @param {Object} options - shouldIgnore 옵션을 지원합니다.
 * @returns {Function} 이벤트 정리 함수입니다.
 */
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

  return useEventListener(document, "click", handleClick);
}
