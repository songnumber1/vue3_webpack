/**
 * @file platform/runtime/runtimeModeHelpers.js
 * @description 실제 런타임(actual runtime) 판별을 한 곳에서 재사용하기 위한 순수 helper입니다.
 *
 * 주의:
 * - 이 파일은 화면 크기(layout mode)를 판단하지 않습니다.
 * - platform override가 반영된 env/runtime/device와 실제 actual* 값을 섞지 않습니다.
 * - Android 키보드/OverlayScrollbar 정책은 실제 Android 런타임 기준으로만 판단합니다.
 */

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function hasAndroidUserAgent(info = {}) {
  return /Android/i.test(String(info.userAgent || ""));
}

/**
 * 실제 Android 계열 런타임인지 판단합니다.
 * @param {object} info - platformStore.info 또는 동일한 플랫폼 메타 정보 객체
 * @returns {boolean} 실제 Android Chrome/WebView/App이면 true
 */
export function isActualAndroidRuntimeInfo(info = {}) {
  const actualEnv = normalizeText(info.actualEnv);
  const actualDevice = normalizeText(info.actualDevice);
  const actualBrowser = normalizeText(info.actualBrowser);

  return Boolean(
    actualEnv === "android" ||
    actualDevice === "android" ||
    actualDevice === "android-webview" ||
    actualBrowser === "android-webview" ||
    info.isAndroidApp ||
    hasAndroidUserAgent(info)
  );
}

/**
 * 실제 Android WebView 런타임인지 판단합니다.
 * @param {object} info - platformStore.info 또는 동일한 플랫폼 메타 정보 객체
 * @returns {boolean} 실제 Android WebView/App이면 true
 */
export function isActualAndroidWebViewRuntimeInfo(info = {}) {
  const actualDevice = normalizeText(info.actualDevice);
  const actualBrowser = normalizeText(info.actualBrowser);

  return Boolean(
    actualDevice === "android-webview" ||
    actualBrowser === "android-webview" ||
    info.isAndroidApp
  );
}

/**
 * 실제 Android Chrome 런타임인지 판단합니다.
 * Android WebView는 별도 런타임으로 취급합니다.
 * @param {object} info - platformStore.info 또는 동일한 플랫폼 메타 정보 객체
 * @returns {boolean} 실제 Android Chrome이면 true
 */
export function isActualAndroidChromeRuntimeInfo(info = {}) {
  if (!isActualAndroidRuntimeInfo(info)) return false;
  if (isActualAndroidWebViewRuntimeInfo(info)) return false;

  const actualBrowser = normalizeText(info.actualBrowser);
  const userAgent = String(info.userAgent || "");

  return Boolean(
    actualBrowser === "chrome" ||
    (/Android/i.test(userAgent) &&
      /(Chrome|Chromium)\//i.test(userAgent) &&
      !/; wv\)/i.test(userAgent) &&
      !/Version\/\d+/i.test(userAgent))
  );
}

/**
 * 실제 데스크톱 런타임인지 판단합니다.
 * @param {object} info - platformStore.info 또는 동일한 플랫폼 메타 정보 객체
 * @returns {boolean} 실제 Android가 아니면 true
 */
export function isActualDesktopRuntimeInfo(info = {}) {
  return !isActualAndroidRuntimeInfo(info);
}

/**
 * 실제 런타임 모드를 문자열로 반환합니다.
 * @param {object} info - platformStore.info 또는 동일한 플랫폼 메타 정보 객체
 * @returns {"android-webview"|"android-chrome"|"android"|"desktop"}
 */
export function resolveActualRuntimeMode(info = {}) {
  if (isActualAndroidWebViewRuntimeInfo(info)) return "android-webview";
  if (isActualAndroidChromeRuntimeInfo(info)) return "android-chrome";
  if (isActualAndroidRuntimeInfo(info)) return "android";
  return "desktop";
}

/**
 * 플랫폼 강제 설정이 켜졌는지 판단합니다.
 * @param {object} info - platformStore.info 또는 동일한 플랫폼 메타 정보 객체
 * @returns {boolean} 강제 플랫폼 설정이면 true
 */
export function isPlatformOverrideEnabledInfo(info = {}) {
  return Boolean(info.isPlatformForced || info.platformOverride);
}
