/**
 * @file platform/runtime/runtimeTypes.js
 * @description 브라우저/모바일/WebView 실행 환경 차이를 흡수하는 platform 계층입니다.
 */

/**
 * 스트림 실행 런타임 환경 유형을 정의하는 상수 객체입니다.
 */
export const STREAM_RUNTIME_TYPES = Object.freeze({
  /** 모바일 전용 브라우저 환경 (`"mobile-browser"`) */
  MOBILE_BROWSER: "mobile-browser",

  /** 안드로이드 순정 크롬 브라우저 환경 (`"android-chrome"`) */
  ANDROID_CHROME: "android-chrome",

  /** 안드로이드 앱 내 웹뷰 브릿지 환경 (`"android-webview"`) */
  ANDROID_WEBVIEW: "android-webview",
});
