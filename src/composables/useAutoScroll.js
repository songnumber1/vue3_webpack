import {nextTick} from "vue";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description afterFrame 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} callback - callback 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function afterFrame(callback) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (
    typeof window === "undefined" ||
    typeof window.requestAnimationFrame !== "function"
  ) {
    setTimeout(callback, 0);
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(callback);
  });
}

/**
 * @description useAutoScroll 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} targetRef - targetRef 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function useAutoScroll(targetRef) {
  /**
   * @description scrollToBottom 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} options - options 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function scrollToBottom(options = {}) {
    await nextTick();

    afterFrame(() => {
      const target = targetRef.value;
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!target) return;

      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (typeof target.scrollToBottom === "function") {
        target.scrollToBottom(options);
      }
    });
  }

  // 계산된 결과를 호출부로 반환합니다.
  return {scrollToBottom};
}
