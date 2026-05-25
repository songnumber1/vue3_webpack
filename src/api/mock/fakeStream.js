/**
 * @file api/mock/fakeStream.js
 * @description 개발/데모용 mock API 또는 mock 데이터입니다. 실제 API 비활성화 시 화면 동작을 보장합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export function streamText(text, onChunk, options = {}) {
  const delay = options.delay ?? 14;
  let index = 0;

  return new Promise((resolve) => {
    const timer = setInterval(() => {
      index += 1;
      onChunk(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, delay);
  });
}
