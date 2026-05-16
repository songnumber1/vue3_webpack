/**
 * @description normalizeVersion 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} version - version 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function normalizeVersion(version) {
  // 계산된 결과를 호출부로 반환합니다.
  return String(version || "0")
    .split(".")
    .map((part) => {
      const parsed = Number.parseInt(part, 10);
      // 계산된 결과를 호출부로 반환합니다.
      return Number.isNaN(parsed) ? 0 : parsed;
    });
}

/**
 * @description compareVersion 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} currentVersion - currentVersion 입력값입니다.
 * @param {*} targetVersion - targetVersion 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function compareVersion(currentVersion, targetVersion) {
  const current = normalizeVersion(currentVersion);
  const target = normalizeVersion(targetVersion);
  const maxLength = Math.max(current.length, target.length);

  // 목록 또는 결과 집합을 순회하면서 필요한 값만 선별합니다.
  for (let index = 0; index < maxLength; index += 1) {
    const currentPart = current[index] || 0;
    const targetPart = target[index] || 0;

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (currentPart > targetPart) return 1;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (currentPart < targetPart) return -1;
  }

  // 계산된 결과를 호출부로 반환합니다.
  return 0;
}

/**
 * @description isVersionLowerThan 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} currentVersion - currentVersion 입력값입니다.
 * @param {*} targetVersion - targetVersion 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function isVersionLowerThan(currentVersion, targetVersion) {
  // 계산된 결과를 호출부로 반환합니다.
  return compareVersion(currentVersion, targetVersion) < 0;
}
