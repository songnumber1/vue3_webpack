/**
 * @description streamText 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} text - text 입력값입니다.
 * @param {*} onChunk - onChunk 입력값입니다.
 * @param {*} options - options 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function streamText(text, onChunk, options = {}) {
  const delay = options.delay ?? 14;
  let index = 0;

  return new Promise((resolve) => {
    const timer = setInterval(() => {
      index += 1;
      onChunk(text.slice(0, index));
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (index >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, delay);
  });
}
