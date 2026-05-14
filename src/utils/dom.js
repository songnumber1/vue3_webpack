/**
 * @file dom.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

export function runAfterPaint(callback) {
  if (
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
  ) {
    window.requestAnimationFrame(callback);
    return;
  }

  setTimeout(callback, 0);
}

/**
 * addMediaQueryListener 함수입니다.
 * @param {*} mediaQueryList 함수 실행에 필요한 값입니다.
 * @param {*} listener 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function addMediaQueryListener(mediaQueryList, listener) {
  if (!mediaQueryList) return () => {};

  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }

  if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(listener);
    return () => mediaQueryList.removeListener(listener);
  }

  return () => {};
}
