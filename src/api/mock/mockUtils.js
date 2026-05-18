/**
 * @description cloneMockData 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function cloneMockData(value) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof structuredClone === "function") return structuredClone(value);
  // 계산된 결과를 호출부로 반환합니다.
  return JSON.parse(JSON.stringify(value));
}

/**
 * @description mockDelay 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} ms - ms 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function mockDelay(ms = 120) {
  // 계산된 결과를 호출부로 반환합니다.
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * @description resolveMock 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @param {*} delay - delay 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function resolveMock(value, delay = 120) {
  await mockDelay(delay);
  // 계산된 결과를 호출부로 반환합니다.
  return cloneMockData(value);
}
