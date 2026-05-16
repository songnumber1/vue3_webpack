import {onBeforeUnmount, onMounted} from 'vue';

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description unwrapRoot 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} root - root 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function unwrapRoot(root) {
  const value = typeof root === 'function' ? root() : root;
  // 계산된 결과를 호출부로 반환합니다.
  return value?.value || value;
}

/**
 * @description useOutsideClick 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} roots - roots 입력값입니다.
 * @param {*} callback - callback 입력값입니다.
 * @param {*} options - options 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function useOutsideClick(roots, callback, options = {}) {
  const shouldIgnore = options.shouldIgnore || (() => false);

  /**
   * @description handleClick 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} event - event 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function handleClick(event) {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (shouldIgnore(event)) return;
    const elements = (Array.isArray(roots) ? roots : [roots])
      .map(unwrapRoot)
      .filter(Boolean);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (elements.some((element) => element.contains?.(event.target))) return;
    callback(event);
  }

  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
  onMounted(() => document.addEventListener('click', handleClick));
  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
  onBeforeUnmount(() => document.removeEventListener('click', handleClick));

  // 계산된 결과를 호출부로 반환합니다.
  return () => document.removeEventListener('click', handleClick);
}
