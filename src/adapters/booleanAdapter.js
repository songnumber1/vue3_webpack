/**
 * @description toBoolean 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function toBoolean(value) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof value === "boolean") return value;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof value === "number") return value !== 0;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (["true", "y", "yes", "1"].includes(normalized)) return true;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (["false", "n", "no", "0", ""].includes(normalized)) return false;
  }
  // 계산된 결과를 호출부로 반환합니다.
  return Boolean(value);
}
