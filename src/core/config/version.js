/**
 * @file core/config/version.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 */

/**
 * 외부 입력 또는 API 응답을 내부 화면 모델에 맞게 정규화합니다.
 */
function normalizeVersion(version) {
  return String(version || "0")
    .split(".")
    .map((part) => {
      const parsed = Number.parseInt(part, 10);

      return Number.isNaN(parsed) ? 0 : parsed;
    });
}
export function compareVersion(currentVersion, targetVersion) {
  const current = normalizeVersion(currentVersion);
  const target = normalizeVersion(targetVersion);
  const maxLength = Math.max(current.length, target.length);

  for (let index = 0; index < maxLength; index += 1) {
    const currentPart = current[index] || 0;
    const targetPart = target[index] || 0;

    if (currentPart > targetPart) return 1;
    if (currentPart < targetPart) return -1;
  }

  return 0;
}
export function isVersionLowerThan(currentVersion, targetVersion) {
  return compareVersion(currentVersion, targetVersion) < 0;
}
