/**
 * @file version.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
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
