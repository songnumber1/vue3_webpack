/**
 * @file composables/events/useOutsideClick.js
 * @description Vue Composition API 기반 상태/행동 분리 모듈입니다. UI 컴포넌트의 복잡도를 낮추기 위해 사용됩니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {useEventListener} from "@vueuse/core";

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function unwrapRoot(root) {
  const value = typeof root === "function" ? root() : root;
  return value?.value || value;
}

/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function isEventInsideElement(event, element) {
  if (!element) return false;
  const path =
    typeof event.composedPath === "function" ? event.composedPath() : [];
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

    if (elements.some((element) => isEventInsideElement(event, element)))
      return;
    callback(event);
  }

  return useEventListener(document, eventName, handleOutsideEvent, {
    capture: true,
    passive: true,
  });
}
