/**
 * @file platform/runtime/runtimeTypes.js
 * @description 브라우저/모바일/WebView 실행 환경 차이를 흡수하는 platform 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

/**
 * 스트림 실행 런타임 환경 유형을 정의하는 상수 객체입니다.
 */
export const STREAM_RUNTIME_TYPES = Object.freeze({
  /** 데스크톱 브라우저 환경 (`"desktop-browser"`) */
  DESKTOP_BROWSER: "desktop-browser",

  /** 안드로이드 순정 크롬 브라우저 환경 (`"android-chrome"`) */
  ANDROID_CHROME: "android-chrome",

  /** 안드로이드 앱 내 웹뷰 브릿지 환경 (`"android-webview"`) */
  ANDROID_WEBVIEW: "android-webview",
});
