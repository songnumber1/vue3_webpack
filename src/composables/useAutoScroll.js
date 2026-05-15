/**
 * @file useAutoScroll.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {nextTick} from "vue";

/**
 * afterFrame 처리 함수입니다.
 * @param {*} callback 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function afterFrame(callback) {
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
 * Scroll helper for chat screens.
 *
 * The helper intentionally delegates the actual scroll decision to MessageList.
 * MessageList knows whether the user is already near the bottom and can prevent
 * desktop resize/layout changes from stealing the user's current scroll position.
 */
export function useAutoScroll(targetRef) {
  /**
   * scrollToBottom 처리 함수입니다.
   * @param {*} options 함수 실행에 필요한 입력값입니다.
   * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
   */
  async function scrollToBottom(options = {}) {
    await nextTick();

    afterFrame(() => {
      const target = targetRef.value;
      if (!target) return;

      if (typeof target.scrollToBottom === "function") {
        target.scrollToBottom(options);
      }
    });
  }

  return {scrollToBottom};
}
