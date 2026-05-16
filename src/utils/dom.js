/**
 * @description runAfterPaint 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} callback - callback 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function runAfterPaint(callback) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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
 * @description addMediaQueryListener 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} mediaQueryList - mediaQueryList 입력값입니다.
 * @param {*} listener - listener 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function addMediaQueryListener(mediaQueryList, listener) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!mediaQueryList) return () => {};

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", listener);
    // 계산된 결과를 호출부로 반환합니다.
    return () => mediaQueryList.removeEventListener("change", listener);
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(listener);
    // 계산된 결과를 호출부로 반환합니다.
    return () => mediaQueryList.removeListener(listener);
  }

  // 계산된 결과를 호출부로 반환합니다.
  return () => {};
}
