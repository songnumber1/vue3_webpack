import {PLATFORM_OVERRIDE_MODES} from "@/constants/systemSettings";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";
import {logPlatformDebug} from "@/platform/platformDebug";
import {STREAM_RUNTIME_TYPES} from "@/platform/runtime/runtimeTypes";

/**
 * 브라우저의 userAgent 문자열을 안전하게 가져옵니다.
 * @returns {string} userAgent 문자열 (서버 사이드 렌더링 환경이거나 값 자체를 읽을 수 없을 경우 빈 문자열)
 */
function getUserAgent() {
  // 현재 실행 환경이 서버 사이드(window 객체가 없는 Node.js 등)라면 안전하게 빈 문자열을 반환합니다.
  if (typeof window === "undefined") return "";

  // window.navigator.userAgent 값이 존재하면 문자열로 캐스팅하여 반환하고, 없으면 빈 문자열을 반환합니다.
  return String(window.navigator?.userAgent || "");
}

/**
 * 안드로이드 앱에서 주입한 하이브리드 웹뷰 Bridge인 `window.AndroidBridge` 존재 여부를 확인합니다.
 * @returns {boolean} 안드로이드 웹뷰 Bridge 존재 여부 (존재하면 true, 아니면 false)
 * @see {@link STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW} 판별의 핵심 기준이 됩니다.
 */
export function hasAndroidWebViewBridge() {
  // 클라이언트 환경(window 존재)이면서, 동시에 전역 객체에 'AndroidBridge'가 실재하는지 검사하여 boolean으로 반환합니다.
  return typeof window !== "undefined" && Boolean(window.AndroidBridge);
}

/**
 * 현재 브라우저의 UserAgent를 분석하여 지원 대상인 '순정 안드로이드 크롬'인지 확인합니다.
 * 다른 모바일 브라우저(삼성 인터넷, 파이어폭스, 엣지, 오페라 등) 및 일반 웹뷰 환경은 제외합니다.
 * @returns {boolean} 순정 안드로이드 크롬 환경일 경우 true, 그 외의 경우 false
 * @see {@link STREAM_RUNTIME_TYPES.ANDROID_CHROME} 판별의 핵심 기준이 됩니다.
 */
export function isAndroidChromeUserAgent() {
  // 현재 브라우저의 고유 유저 에이전트(userAgent) 문자열을 획득합니다.
  const ua = getUserAgent();

  // 기본 전제: 대소문자 구분 없이 문자열 내에 'Android'와 'Chrome'이 모두 매칭되어야 하며, 하나라도 없으면 탈락(false)입니다.
  if (!/Android/i.test(ua) || !/Chrome\//i.test(ua)) return false;

  // 삼성 인터넷 브라우저(SamsungBrowser) 식별 시 지원 대상에서 제외합니다.
  if (/SamsungBrowser\//i.test(ua)) return false;

  // 마이크로소프트 엣지(EdgA) 또는 오페라(OPR, Opera) 모바일 브라우저 식별 시 제외합니다.
  if (/EdgA\//i.test(ua) || /OPR\//i.test(ua) || /Opera\//i.test(ua)) {
    return false;
  }

  // 파이어폭스(Firefox, FxiOS) 모바일 브라우저 식별 시 제외합니다.
  if (/Firefox\//i.test(ua) || /FxiOS\//i.test(ua)) return false;

  // 네이티브 인앱 웹뷰의 전형적인 특징인 '; wv)' 표기 또는 'Version/X.X' 패턴이 매칭되는 일반 안드로이드 웹뷰는 제외합니다.
  if (/; wv\)/i.test(ua) || /Version\/\d+/i.test(ua)) return false;

  // 상기 모든 타사 브라우저 및 웹뷰 특이 케이스 필터링을 통과했으므로 순정 안드로이드 크롬으로 판정합니다.
  return true;
}

/**
 * 현재 애플리케이션이 실행되고 있는 스트림 런타임 환경 유형(Runtime Type)을 최종 판별합니다.
 * * * **반환 런타임 유형 종류 목록:**
 * - {@link STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW} : 네이티브 앱 브릿지가 감지된 경우
 * - {@link STREAM_RUNTIME_TYPES.ANDROID_CHROME} : 순정 안드로이드 크롬 브라우저 환경인 경우
 * - {@link STREAM_RUNTIME_TYPES.DESKTOP_BROWSER} : 상기 모바일 조건에 부합하지 않는 기본 PC/데스크톱 환경인 경우
 * * @returns {string} {@link STREAM_RUNTIME_TYPES}에 정의된 런타임 문자열 상수 값
 * @see {@link hasAndroidWebViewBridge} 웹뷰 판단 함수
 * @see {@link isAndroidChromeUserAgent} 크롬 브라우저 판단 함수
 */
export function resolveStreamRuntimeType() {
  const settings = getRuntimeSystemSettings();
  const override = settings.platformOverride || PLATFORM_OVERRIDE_MODES.auto;
  const hasBridge = hasAndroidWebViewBridge();
  const isAndroidChromeUa = isAndroidChromeUserAgent();
  let runtimeType = STREAM_RUNTIME_TYPES.DESKTOP_BROWSER;
  let reason = "desktop-browser-default";

  if (override === PLATFORM_OVERRIDE_MODES.androidChrome) {
    runtimeType = STREAM_RUNTIME_TYPES.ANDROID_CHROME;
    reason = "forced-android-chrome";
  } else if (override === PLATFORM_OVERRIDE_MODES.androidWebView) {
    runtimeType = STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW;
    reason = "forced-android-webview";
  } else if (hasBridge) {
    runtimeType = STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW;
    reason = "actual-android-webview-bridge";
  } else if (isAndroidChromeUa) {
    runtimeType = STREAM_RUNTIME_TYPES.ANDROID_CHROME;
    reason = "actual-android-chrome-user-agent";
  }

  logPlatformDebug("sse.runtime", {
    override,
    runtimeType,
    reason,
    hasAndroidWebViewBridge: hasBridge,
    isAndroidChromeUserAgent: isAndroidChromeUa,
  });

  return runtimeType;
}

/**
 * 지정된 런타임 환경 또는 현재의 실행 환경이 '안드로이드 크롬'인지 판단합니다.
 * @param {string} [runtimeType=resolveStreamRuntimeType()] - 검사할 런타임 타입 문자열 (생략 시 {@link resolveStreamRuntimeType}의 결과값 사용)
 * @returns {boolean} 안드로이드 크롬 런타임 환경과 완벽히 일치하면 true, 아니면 false
 * @see {@link STREAM_RUNTIME_TYPES.ANDROID_CHROME}
 */
export function isAndroidChromeRuntime(
  runtimeType = resolveStreamRuntimeType()
) {
  // 주입받거나 판별된 runtimeType 파라미터가 상수의 ANDROID_CHROME 값과 일치하는지 비교 검증합니다.
  return runtimeType === STREAM_RUNTIME_TYPES.ANDROID_CHROME;
}

/**
 * 지정된 런타임 환경 또는 현재의 실행 환경이 '안드로이드 웹뷰'인지 판단합니다.
 * @param {string} [runtimeType=resolveStreamRuntimeType()] - 검사할 런타임 타입 문자열 (생략 시 {@link resolveStreamRuntimeType}의 결과값 사용)
 * @returns {boolean} 안드로이드 웹뷰 런타임 환경과 완벽히 일치하면 true, 아니면 false
 * @see {@link STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW}
 */
export function isAndroidWebViewRuntime(
  runtimeType = resolveStreamRuntimeType()
) {
  // 주입받거나 판별된 runtimeType 파라미터가 상수의 ANDROID_WEBVIEW 값과 일치하는지 비교 검증합니다.
  return runtimeType === STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW;
}

/**
 * 지정된 런타임 환경 또는 현재의 실행 환경이 '데스크톱 브라우저'인지 판단합니다.
 * @param {string} [runtimeType=resolveStreamRuntimeType()] - 검사할 런타임 타입 문자열 (생략 시 {@link resolveStreamRuntimeType}의 결과값 사용)
 * @returns {boolean} 데스크톱 브라우저 런타임 환경과 완벽히 일치하면 true, 아니면 false
 * @see {@link STREAM_RUNTIME_TYPES.DESKTOP_BROWSER}
 */
export function isDesktopBrowserRuntime(
  runtimeType = resolveStreamRuntimeType()
) {
  // 주입받거나 판별된 runtimeType 파라미터가 상수의 DESKTOP_BROWSER 값과 일치하는지 비교 검증합니다.
  return runtimeType === STREAM_RUNTIME_TYPES.DESKTOP_BROWSER;
}
