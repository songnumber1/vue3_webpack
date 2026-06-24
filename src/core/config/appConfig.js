/**
 * @file core/config/appConfig.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 */

import {RUN_ENV, PLATFORM} from "./constants";
import {createDefaultConfig} from "./default";
import {createAndroidConfig} from "./android";
import {createExtensionConfig} from "./extension";

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getNavigator() {
  // [SSR 안전 가드]: Nuxt 등 서버 사이드 렌더링 스택이나 Node.js 단독 테스트 런타임에서는 전역 window/navigator 객체가 존재하지 않아
  // 스크립트가 파괴될 수 있으므로, typeof 예외 처리를 거쳐 안전하게 브라우저 네이티브 하드웨어 정보 포인터를 수거합니다.
  return typeof window === "undefined" ? null : window.navigator;
}

export function hasAndroidBridge() {
  // 웹뷰 실행 시 안드로이드 네이티브 자바 코드가 주입해 주는 실시간 소통 인터페이스 윈도우 프로퍼티(`AndroidBridge`) 존재 유무 검증
  return typeof window !== "undefined" && Boolean(window.AndroidBridge);
}

export function hasExtensionRuntime() {
  if (typeof window === "undefined") return false;
  // 크롬(chrome.runtime) 또는 파이어폭스/사파리 표준 웹익스텐션(browser.runtime) 엔진의 고유 아이디(id) 활성화 여부를 교차 검증하여 확장 프로그램 내부 구동 국면인지 판별
  return Boolean(window.chrome?.runtime?.id || window.browser?.runtime?.id);
}

export function detectBrowserPlatform() {
  const nav = getNavigator();
  const ua = nav?.userAgent || ""; // 기기 브라우저 커널 및 하드웨어 메타 정보 문자열 로드
  const platform = nav?.platform || ""; // 운영체제 코어 빌드 아키텍처 문자열 로드

  // 정규식 대소문자 무시(i) 플래그를 활용해 정밀하게 타깃 OS 분기 필터링 수행
  if (/Android/i.test(ua)) return PLATFORM.ANDROID;
  if (/Mac/i.test(platform)) return PLATFORM.MAC;
  if (/Win/i.test(platform)) return PLATFORM.WINDOWS;
  if (/Linux/i.test(platform)) return PLATFORM.LINUX;
  return PLATFORM.UNKNOWN; // 미확인 환경일 경우 안전 폴백을 위해 미지 플랫폼 코드로 마감
}

export function resolveAppConfig() {
  // [우선순위 1순위 하이재킹]: 안드로이드 전용 웹뷰 브릿지가 식별되었다면 앱 내 인앱 특수 권한 및 플러그인을 바인딩하는 안드로이드 전용 설정 팩토리 가동
  if (hasAndroidBridge()) return createAndroidConfig(window.AndroidBridge);

  // [우선순위 2순위 하이재킹]: 크롬/웨일/파이어폭스 확장 프로그램 샌드박스 내부라면 확장 프로그램 백그라운드 스크립트 연동 전용 설정 팩토리 가동
  if (hasExtensionRuntime())
    return createExtensionConfig(detectBrowserPlatform());

  // [최종 기본값 폴백]: 상위 하이브리드 앱 가드가 모두 발동하지 않는 일반 PC/모바일 사파리/크롬 웹 사이트 상태라면 표준 공통 설정 팩토리 가동
  return createDefaultConfig(detectBrowserPlatform());
}

export function isNativeApp(appInfo) {
  // 파싱 완성된 설정 객체의 런타임 환경 상태가 가상 웹(WEB)이 아닌 하드웨어 네이티브(NATIVE) 모드인지 감별
  return appInfo?.env === RUN_ENV.NATIVE;
}

export function isAndroidApp(appInfo) {
  // 네이티브 앱 플래그 조건과 타깃 OS 플랫폼의 안드로이드 상수가 둘 다 완전 합집합 교집합을 이룰 때에만 안드로이드 독립 앱으로 확정 진단
  return isNativeApp(appInfo) && appInfo?.platform === PLATFORM.ANDROID;
}

export {RUN_ENV, PLATFORM};
