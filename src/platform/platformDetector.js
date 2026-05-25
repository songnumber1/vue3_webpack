/**
 * @file platform/platformDetector.js
 * @description 브라우저/모바일/WebView 실행 환경 차이를 흡수하는 platform 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {
  RUN_ENV,
  PLATFORM,
  hasAndroidBridge,
  hasExtensionRuntime,
} from "@/core/config";
import {
  DEFAULT_MOBILE_BREAKPOINT_PX,
  MAX_MOBILE_BREAKPOINT_PX,
  MIN_MOBILE_BREAKPOINT_PX,
  PLATFORM_OVERRIDE_MODES,
} from "@/constants/systemSettings";
import {logPlatformDebug} from "@/platform/platformDebug";

/**
 * @description 서버 사이드 렌더링(SSR) 환경을 고려하여 안전하게 전역 window.navigator 객체를 참조합니다.
 * @returns {object} 브라우저 네이티브 navigator 객체 또는 빈 객체
 */
function getNavigator() {
  return typeof window === "undefined" ? {} : window.navigator || {};
}

/**
 * @description 서버 사이드 렌더링(SSR) 환경을 고려하여 안전하게 전역 window.screen 객체를 참조합니다.
 * @returns {object} 하드웨어 모니터 디스플레이 스크린 객체 또는 빈 객체
 */
function getScreen() {
  return typeof window === "undefined" ? {} : window.screen || {};
}

/**
 * @description 정규식 패턴을 사용하여 User-Agent 문자열로부터 특정 소프트웨어의 버전 정보를 추출합니다.
 * @param {string} ua - 브라우저 고유 User-Agent 문자열
 * @param {RegExp} pattern - 버전을 캡처하기 위한 정규식 패턴
 * @returns {string} 매칭 완료된 버전 문자열 (미매칭 시 빈 문자열)
 */
/**
 * 문자열 또는 stream buffer를 의미 있는 frame/object로 파싱합니다.
 */
function parseVersion(ua, pattern) {
  const match = ua.match(pattern); // 정규식 매칭 수행
  return match?.[1] || ""; // 첫 번째 캡처 그룹 반환 및 예외 가드 처리
}

/**
 * @description 현재 클라이언트 진입 환경이 안드로이드 인앱 웹뷰(WebView)인지 UA 식별 구조를 대조하여 판별합니다.
 * @param {string} ua - 브라우저 고유 User-Agent 문자열
 * @returns {boolean} 안드로이드 웹뷰 환경 여부
 */
/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function isAndroidWebViewUserAgent(ua) {
  // 'Android' 문구를 포함하면서, 무선 웹뷰 식별자 '; wv)' 가 있거나 크롬 웹뷰 규격인 'Version/숫자' 형태가 존재하는지 검사
  return (
    /Android/i.test(ua) && (/; wv\)/i.test(ua) || /Version\/\d+/i.test(ua))
  );
}

/**
 * @description User-Agent 문자열 및 하이브리드 브릿지 유무를 대조하여 현재 가동 중인 마스터 브라우저의 종류 명칭을 식별합니다.
 * @param {string} ua - 브라우저 고유 User-Agent 문자열
 * @param {boolean} [hasBridge=false] - 안드로이드 하이브리드 네이티브 앱 브릿지 소유 여부
 * @returns {string} 브라우저 식별 카테고리 문자열 키 (예: 'chrome', 'samsung', 'webview' 등)
 */
/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getBrowserName(ua, hasBridge = false) {
  if (hasBridge) return "webview"; // 네이티브 앱 브릿지가 점등되어 있다면 즉시 웹뷰로 분류
  if (/SamsungBrowser\//i.test(ua)) return "samsung"; // 삼성 인터넷 브라우저 판별
  if (/EdgA\//i.test(ua)) return "edge"; // 모바일 마이크로소프트 엣지 브라우저 판별
  if (/OPR\//i.test(ua) || /Opera\//i.test(ua)) return "opera"; // 오페라 브라우저 판별
  if (/Firefox\//i.test(ua) || /FxiOS\//i.test(ua)) return "firefox"; // 파이어폭스(iOS 포함) 브라우저 판별
  if (isAndroidWebViewUserAgent(ua)) return "android-webview"; // 순수 안드로이드 시스템 웹뷰 판별
  if (/Chrome\//i.test(ua)) return "chrome"; // 구글 크롬 브라우저 판별
  return "unknown"; // 매칭되는 규칙이 없을 때 폴백 반환
}

/**
 * @description 식별된 브라우저의 메인 타깃 상세 버전 정보를 추출합니다. (현재 크롬 사양만 정밀 추적 지원)
 * @param {string} ua - 브라우저 고유 User-Agent 문자열
 * @param {string} browserName - getBrowserName 함수를 통해 1차 식별된 브라우저 명칭
 * @returns {string} 점으로 구분된 상세 버전 넘버 텍스트
 */
/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getBrowserVersion(ua, browserName) {
  if (browserName === "chrome") return parseVersion(ua, /Chrome\/([\d.]+)/i); // 크롬 버전 정밀 캡처 파싱
  return ""; // 크롬 외 브라우저는 공백 폴백 가드
}

/**
 * @description 네이티브 navigator.platform 정보 및 User-Agent 정보를 조합하여 기본적인 구동 운영체제(OS) 환경을 유독 감지합니다.
 * @param {string} ua - 브라우저 고유 User-Agent 문자열
 * @param {string} platform - navigator.platform 하드웨어 아키텍처 식별 스트링
 * @returns {string} PLATFORM 상수에 바인딩된 고유 OS 식별 키
 */
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function detectEnv(ua, platform) {
  if (/Android/i.test(ua)) return PLATFORM.ANDROID; // 안드로이드 환경 모바일 기기 감지
  if (/Win/i.test(platform)) return PLATFORM.WINDOWS; // 마이크로소프트 윈도우 PC 감지
  if (/Mac/i.test(platform)) return PLATFORM.MAC; // 애플 맥오에스(macOS) 장치 감지
  if (/Linux/i.test(platform)) return PLATFORM.LINUX; // 리눅스 서버 및 데스크톱 환경 감지
  return PLATFORM.UNKNOWN; // 최종 판별 불능 시 폴백 예외 가드
}

/**
 * @description 수동으로 이식받은 플랫폼 지정값이 무결한 상수 도메인 영역에 존재하는지 확인하고, 유실 시 엔진 연산식으로 백업 분기 조율합니다.
 * @param {string} value - 외부 및 상위 스토어로부터 전달받은 강제 플랫폼 문자열 값
 * @param {string} ua - 브라우저 고유 User-Agent 문자열
 * @param {string} navPlatform - navigator.platform 하드웨어 아키텍처 식별 스트링
 * @returns {string} 최종 검증 및 추론이 마감된 운영체제(OS) 식별 코드
 */
/**
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveBasePlatform(value, ua, navPlatform) {
  // 상위 주입값이 유효 유효 도메인 풀에 속해 있다면 해당 값을 보존 상속하고, 부재 시 네이티브 OS 추론식 엔진 가동
  return Object.values(PLATFORM).includes(value)
    ? value
    : detectEnv(ua, navPlatform);
}

/**
 * @description 식별 완료된 OS 환경과 브라우저 유형의 상호 결합 사양을 대조하여 최종 디바이스 하드웨어 가용 유형을 빌드합니다.
 * @param {object} param0 - 디바이스 분석을 위한 타깃 파라미터 구조체
 * @param {string} param0.env - 1차 검증 완료된 PLATFORM 식별 코드
 * @param {string} param0.browserName - getBrowserName을 통과한 브라우저 코드명
 * @returns {string} 비즈니스 로직 가이드라인에 입각한 최종 디바이스 명칭 키 (예: 'app', 'chrome', 'pc' 등)
 */
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function detectDevice({env, browserName}) {
  if (hasAndroidBridge()) return "app"; // 하이브리드 앱 아웃쉘 전용 자바스크립트 인터페이스 브릿지 검출 시 최상위 'app' 확정 고정
  if (env === PLATFORM.ANDROID)
    return browserName === "chrome" ? "chrome" : "unsupported-android-browser"; // 안드로이드 기기인데 크롬이 아닌 경우 비지원 브라우저 칩 마킹 가드
  if (
    env === PLATFORM.WINDOWS ||
    env === PLATFORM.MAC ||
    env === PLATFORM.LINUX
  )
    return browserName === "unknown" ? "pc" : browserName; // 데스크톱 환경 분기 처리
  return "unknown"; // 매칭 실패 시 미식별 디바이스 폴백 낙태
}

/**
 * @description 실제 오염 가공이 가해지기 전, 장치 하드웨어와 브라우저 엔진이 가진 본연의 순수 런타임 물리 정보를 묶어 구조체로 포맷 가공합니다.
 * @param {object} param0 - 플랫폼 스냅샷 생성을 위한 원시 파싱 요소 세트
 * @param {string} param0.env - 순수 운영체제 환경
 * @param {string} param0.runtime - 코어 엔진 가동 레이어 런타임 유형
 * @param {string} param0.device - 매핑 완료된 디바이스 하드웨어 유형
 * @param {string} param0.browserName - 브라우저 명칭 코드
 * @param {string} param0.browserVersion - 브라우저 상세 버전 정보
 * @returns {object} 포맷팅 및 디버깅용 직관적 라벨 스트링을 동반한 원시 플랫폼 스냅샷 객체
 */
/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createActualPlatformInfo({
  env,
  runtime,
  device,
  browserName,
  browserVersion,
}) {
  return {
    env,
    runtime,
    device,
    browser: browserName,
    browserVersion,
    label: [env, device, browserName].filter(Boolean).join(" / "), // 디버깅 로그 출력용 평탄화 문자열 조립
  };
}

/**
 * @description 개발자 도구 세션 등에서 임의로 인입한 가상 플랫폼 덮어쓰기 명령어가 유효 규격 사양에 입각해 있는지 검증 제어합니다.
 * @param {string} value - 수동 오버라이드 희망 모드 문자열 키
 * @returns {string} 안전성이 보장된 확정 오버라이드 명령어 제어 코드 (기본값은 'auto' 자동 모드)
 */
/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getForcedPlatformOverride(value) {
  return Object.values(PLATFORM_OVERRIDE_MODES).includes(value)
    ? value
    : PLATFORM_OVERRIDE_MODES.auto;
}

/**
 * @description 모바일 레이아웃 강제 수축 반응형 변환 기준점인 해상도 수치를 정밀 정수 규격으로 보정 연산합니다.
 * @param {number|string} value - 외부 주입 픽셀 너비 임계 수치
 * @returns {number} 안전하게 정규화 완료된 반응형 중단점 정수 픽셀 수치
 */
/**
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveCompactBreakpoint(value) {
  const numeric = Number(value); // 명시적 수치 변환
  // 유한한 숫자이면서 유효 가용 양수 범위인 경우 반올림 처리하여 정수 픽셀 확보하고, 에러 사태 시 표준 가이드 디폴트 상수 바인딩 폴백
  return Number.isFinite(numeric)
    ? Math.min(
        Math.max(Math.round(numeric), MIN_MOBILE_BREAKPOINT_PX),
        MAX_MOBILE_BREAKPOINT_PX
      )
    : DEFAULT_MOBILE_BREAKPOINT_PX;
}

/**
 * @description [런타임 디버깅 핵심 에뮬레이터] 개발 환경 또는 운영 설정 상에서 가상 디바이스 강제 에뮬레이팅 플래그가 수립된 경우, 감지 결과를 해당 가상 사양 규격으로 완벽하게 변조 위장시킵니다.
 * @param {object} param0 - 오버라이드 검증 처리를 위한 기감지 데이터 세트
 * @param {object} param0.baseAppInfo - 상위 전역 스토어 등에서 이식 전송받은 런타임 환경 메타 데이터 파라미터
 * @param {object} param0.detected - 하드웨어 탐색 엔진이 1차 감지한 날것의 물리 환경 정보 구조체
 * @returns {object} 위장 모드 플래그(`isForced`)가 온오프 동기화된 가상/실제 플랫폼 정보 결합 구조체
 */
/**
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveForcedPlatform({baseAppInfo, detected}) {
  const override = getForcedPlatformOverride(baseAppInfo.platformOverride); // 수동 강제 덮어쓰기 설정값 로드

  // 케이스 A: 안드로이드 모바일 크롬 브라우저 환경으로 가상 위장 구동 명령을 하달받은 경우
  if (override === PLATFORM_OVERRIDE_MODES.androidChrome) {
    return {
      ...detected,
      env: PLATFORM.ANDROID, // OS 강제 변경 마킹
      runtime: RUN_ENV.BROWSER, // 런타임 환경 브라우저 고정 수립
      device: "chrome", // 가용 디바이스 모듈 강제 스위칭
      browserName: "chrome", // 브라우저명 강제 오염
      browserVersion: detected.browserVersion || "", // 기존 수립 버전 재참조 보존
      isForced: true, // 위장 점등 플래그 ON 공표
    };
  }

  // 케이스 B: 안드로이드 하이브리드 네이티브 앱 시스템 인앱 웹뷰(WebView) 환경으로 가상 위장 구동 명령을 하달받은 경우
  if (override === PLATFORM_OVERRIDE_MODES.androidWebView) {
    return {
      ...detected,
      env: PLATFORM.ANDROID,
      runtime: RUN_ENV.BROWSER,
      device: "android-webview",
      browserName: "android-webview",
      browserVersion: detected.browserVersion || "",
      isForced: true,
    };
  }

  // 케이스 C: 일반 자동 모드('auto') 환경인 경우 날것의 하드웨어 감지 원품 구조체를 그대로 온전하게 반환 바이패스
  return {...detected, isForced: false};
}

/**
 * @description 안드로이드 네이티브 앱 자바스크립트 인터페이스 브릿지 영역을 직접 노크하여 빌드 릴리스 패키지의 마스터 버전 코드를 추출합니다.
 * @returns {string} 네이티브 빌드 버전 넘버 스트링 (미개통 혹은 웹 런타임 환경 시 공백 폴백)
 */
/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getAppVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge; // 전역 브릿지 네이티브 버스 포인터 스캔
  return bridge?.appVersion || bridge?.version || ""; // 상이한 백엔드 네이티브 버전 키 호환성 가드 스크리닝
}

/**
 * @description 안드로이드 네이티브 앱 인터페이스 브릿지 코어가 소유한 브릿지 소켓 자체의 고유 명세 버전을 추출합니다.
 * @returns {string} 브릿지 통신 인프라 자체의 버전 코드 스트링
 */
function getBridgeVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge;
  return bridge?.bridgeVersion || "";
}

/**
 * @description 웹 오디오 API 기반 스마트폰 음성 인식 하드웨어 마이크 제어 모듈을 가동할 수 있는 안전 호환 규격 브라우저인지 검증 가드 처리합니다.
 * @param {object} param0 - 마이크 호환성 대조를 위한 디바이스 사양 팩
 * @param {boolean} param0.isAndroid - 안드로이드 OS 환경 여부
 * @param {boolean} param0.isMobileBrowser - 네이티브 하이브리드 앱 아웃쉘이 아닌 일반 모바일 웹 브라우저 상태 여부
 * @param {string} param0.browserName - 최종 확정된 브라우저 고유 코드명
 * @returns {boolean} 음성 오디오 마이크 탑재 및 시동 가용 유무 플래그
 */
/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function isSupportedMobileMicBrowser({
  isAndroid,
  isMobileBrowser,
  browserName,
}) {
  if (!isAndroid || !isMobileBrowser) return false; // 안드로이드 모바일 웹 환경이 아닌 경우 리소스 보호를 위해 원천 차단 가드
  return browserName === "chrome"; // 안드로이드 환경 상에서는 구글 순수 모바일 크롬 브라우저만 오디오 인프라 파이프라인 공식 허용 수립
}

/**
 * @function resolveDetailedPlatform
 * @description 전역 윈도우 DOM, User-Agent 정보, 네이티브 브릿지 소켓 상태 및 외부 수동 오버라이드 제약 조건을
 * 단일 오케스트레이션 파이프라인으로 종합 통합 연산하여, 전역 스토어가 즉각 정밀 구독 가능한 마스터 플랫폼 스냅샷 메타 데이터셋을 발행합니다.
 * @param {object} [baseAppInfo={}] - 부트스트랩 시점에 외부 앱 쉘이나 로컬 스토리지 캐시 등에서 이식 인입된 런타임 참조 파라미터 세트
 * @returns {object} 최적화 가공 및 정규화가 완결되어 서비스 비즈니스 가드 로직에 플래그로 바인딩될 30여 개의 세부 플랫폼 명세 구조체 본품
 */
export function resolveDetailedPlatform(baseAppInfo = {}) {
  // 1. 네이티브 원시 전역 브라우저 DOM 컨텍스트 자원 안전 확보 및 예외 가드 스캔
  const nav = getNavigator();
  const screen = getScreen();
  const ua = nav.userAgent || ""; // 브라우저 고유 User-Agent 날것의 스트링
  const navPlatform = nav.platform || ""; // 하드웨어 아키텍처 아웃라인 스트링
  const hasBridge = hasAndroidBridge(); // 안드로이드 앱 쉘 컨텍스트 물리 결합 검증 디텍팅

  // 2. 1차 순수 기기 감지 엔진 가동 (물리 하드웨어 정보 디코딩)
  const detectedBrowserName = getBrowserName(ua, hasBridge); // 브라우저 명칭 카테고리 식별
  const detectedBrowserVersion = getBrowserVersion(ua, detectedBrowserName); // 크롬 등 지원 기종 상세 버전 넘버 스캔
  const detectedEnv = resolveBasePlatform(
    baseAppInfo.platform,
    ua,
    navPlatform
  ); // 운영체제(OS) 도메인 코드 확정 추출

  // 하이브리드 브릿지가 있으면 네이티브 앱 코어로 분류하고, 없다면 확장 프로그램 크롬 익스텐션 여부를 감지하며, 둘 다 아닐 시 일반 순수 웹 브라우저로 런타임 통계 분기
  const detectedRuntime = hasBridge
    ? RUN_ENV.NATIVE
    : hasExtensionRuntime()
      ? RUN_ENV.EXTENSION
      : RUN_ENV.BROWSER;

  const detectedDevice = detectDevice({
    env: detectedEnv,
    browserName: detectedBrowserName,
  });

  // 3. 변조 없는 원시 기기 장치 상태를 복제하여 박제 로그로 1차 캡처 보존
  const actualPlatform = createActualPlatformInfo({
    env: detectedEnv,
    runtime: detectedRuntime,
    device: detectedDevice,
    browserName: detectedBrowserName,
    browserVersion: detectedBrowserVersion,
  });

  // 4. [강제 위장 제어부 연계 수립] 개발자 옵션 등의 강제 기기 덮어쓰기 명령 유무를 대조하여 최종 런타임 파라미터 정보로 치환 변조 단행
  const forcedPlatform = resolveForcedPlatform({
    baseAppInfo,
    detected: {
      env: detectedEnv,
      runtime: detectedRuntime,
      device: detectedDevice,
      browserName: detectedBrowserName,
      browserVersion: detectedBrowserVersion,
    },
  });

  // 5. 최종 필터링을 통과한 파라미터 값들을 내부 비즈니스 플래그 변수군으로 파싱 및 구조해제 디스트럭처링 상속 수립
  const browserName = forcedPlatform.browserName;
  const browserVersion = forcedPlatform.browserVersion;
  const env = forcedPlatform.env;
  const runtime = forcedPlatform.runtime;
  const device = forcedPlatform.device;

  // 6. 뷰포트 가시 플래그 및 보안 접근 인가 도메인 세부 연쇄 유도 연산 연산
  const isAndroid = env === PLATFORM.ANDROID;
  const isWindows = env === PLATFORM.WINDOWS;
  const isNativeApp = runtime === RUN_ENV.NATIVE;
  const isAndroidApp = isAndroid && hasBridge; // 안드로이드 환경이면서 물리 브릿지가 생동력 있게 개통된 하이브리드 클라이언트 앱 상태
  const isMobile = isAndroid; // 타 모바일 기기 확장 영역 확보용 폴백 바인딩
  const isMobileBrowser = isMobile && !isNativeApp; // 모바일 기기이지만 네이티브 패키지 쉘 내부가 아닌 삼성인터넷/크롬탭 웹 서핑 상태

  // [보안 및 비즈니스 정책 가드 처리] 안드로이드 모바일 웹 접속인데 크롬 브라우저 정식 규격이 아니고 개발자 위장 모드도 아니라면 서비스 불허 타깃으로 격리 낙태 판별 수립
  const isUnsupportedBrowser =
    isMobileBrowser && browserName !== "chrome" && !forcedPlatform.isForced;
  const unsupportedReason = isUnsupportedBrowser
    ? "unsupported-android-browser"
    : "";
  const isAccess = !isUnsupportedBrowser; // 접근 승인 패스 여부 최종 마킹

  // 7. 가상 소프트웨어 키보드 오픈 충돌 방어 및 모바일 반응형 수축 레이아웃 결정을 위한 하드웨어 물리 실시간 너비 해상도 감지식 연산
  const width = typeof window === "undefined" ? 0 : window.innerWidth; // 표준 브라우저 윈도우 안쪽 너비
  const height = typeof window === "undefined" ? 0 : window.innerHeight; // 표준 브라우저 윈도우 안쪽 높이
  const visualWidth =
    typeof window === "undefined"
      ? 0
      : Math.round(window.visualViewport?.width || 0); // 모바일 가상 소프트 자판 핀치줌 대응 뷰포트 너비 정밀 캡처

  // 유효 정수 해상도 수치 필터링 필터링
  const compactWidthCandidates = [visualWidth, width].filter(
    (value) => Number.isFinite(value) && value > 0
  );
  // 모바일 가상 소프트 자판이 솟구쳐 올라 뷰포트가 수축 변형을 일으켰을 때를 대비하여 안전하게 둘 중 가장 압축된 수직 해상도 최소치를 앵커 해상도로 채택
  const compactWidth = compactWidthCandidates.length
    ? Math.min(...compactWidthCandidates)
    : 0;

  const compactBreakpoint = resolveCompactBreakpoint(
    baseAppInfo.mobileBreakpoint
  ); // 최종 수립된 반응형 중단점 경계선 픽셀 로드
  const isCompactViewport =
    compactWidth > 0 && compactWidth <= compactBreakpoint; // 현재 물리 화면 가로폭이 기준 중단점 픽셀 이하로 스몰 압축 모바일 레이아웃 모드인지 판별

  const isMic = isSupportedMobileMicBrowser({
    isAndroid,
    isMobileBrowser,
    browserName,
  }); // 앞서 선언한 마이크 음성인식 가용 조건식 연계 수립

  // 8. 진단 분석 정보 및 해상도 트랙킹 스냅샷 데이터를 콘솔 디버그 파이프라인 버스에 영구 박제 처리
  logPlatformDebug("platform.resolve", {
    platformOverride: getForcedPlatformOverride(baseAppInfo.platformOverride),
    isPlatformForced: forcedPlatform.isForced,
    actualPlatform: actualPlatform.label,
    resolved: {
      env,
      runtime,
      device,
      browser: browserName,
      isAndroid,
      isMobile,
      isMobileBrowser,
      isAndroidApp,
      isCompactViewport,
    },
    viewport: {width, height, visualWidth, compactWidth, compactBreakpoint},
  });

  // 9. 전역 Pinia 스토어 및 코어 컴포넌트 계층이 즉각 수신할 마스터 마스터 복합 데이터셋 리턴 반환
  return {
    env, // 운영체제 코드
    runtime, // 런타임 모드 환경 코드
    device, // 하드웨어 기기 분류명
    browser: browserName, // 브라우저 식별명
    browserVersion, // 브라우저 버전 번호
    userAgent: ua, // 원시 UA 백업 기록
    platform: navPlatform, // 원시 네이티브 플랫폼 하드웨어 칩셋 코드 정보
    actualPlatform, // 오버라이드가 반영되지 않은 실제 디바이스 날것의 정보 묶음 구조체
    actualEnv: actualPlatform.env,
    actualRuntime: actualPlatform.runtime,
    actualDevice: actualPlatform.device,
    actualBrowser: actualPlatform.browser,
    actualBrowserVersion: actualPlatform.browserVersion,
    actualPlatformLabel: actualPlatform.label,
    language: nav.language || "", // 브라우저 최우선 선호 인가 언어셋 (ko-KR 등)
    languages: Array.from(nav.languages || []), // 유저가 브라우저에 등록해 둔 다중 다국어 허용 배열 리스트 복제본
    isAccess, // 비지원 브라우저 차단망 통과 및 메인 화면 진입 인가 여부 플래그
    unsupportedReason, // 비지원 브라우저 격리 차단 시 사용될 사유 리포트 코드
    isWindows, // 윈도우 데스크톱 환경 판별 플래그
    isAndroid, // 안드로이드 기기 환경 판별 플래그
    isNativeApp, // 일반 웹 탭 브라우징이 아닌 패키징 설치형 하이브리드 오쉘 클라이언트 구동 상태 여부
    isNativeRuntime: isNativeApp, // 코드 하향 호환성 보존용 런타임 중복 매핑 플래그
    isCompactViewport, // 모바일형 초압축 가로폭 컴팩트 뷰포트 레이아웃 활성화 트리거 플래그
    isAndroidApp, // 안드로이드 순수 순수 하이브리드 네이티브 패키지 내 구동 여부
    isMobile, // 모바일 최적화 레이아웃 분기 트리거용 플래그
    isMobileBrowser, // 스마트폰 환경이되 브릿지 앱 아웃쉘이 없는 범용 브라우저 탭 서핑 상태
    isMic, // 실시간 음성 수집 마이크 모듈 활성화 점등 가드 플래그
    isPlatformForced: forcedPlatform.isForced, // 수동 에뮬레이팅 위장막 가동 여부 플래그
    platformOverride: getForcedPlatformOverride(baseAppInfo.platformOverride), // 수동 오버라이드 커맨드 설정값 백업
    isChrome: browserName === "chrome", // 크롬 엔진 여부 퀵 진단 플래그
    isPc: isWindows || env === PLATFORM.MAC || env === PLATFORM.LINUX, // 정규 PC 데스크톱 제품군 런타임 진입 여부 플래그
    appVersion: getAppVersionFromBridge() || baseAppInfo.appVersion || "1.0.0", // 브릿지 경유 혹은 상위 수임 앱 버전 넘버 마운트
    appBuildVersion: baseAppInfo.appBuildVersion || "", // 앱 내부 형관리용 소스코드 빌드 번호
    bridgeVersion:
      getBridgeVersionFromBridge() || baseAppInfo.bridgeVersion || "", // 네이티브 통신 브릿지 라이브러리 스펙 버전
    deviceId: baseAppInfo.deviceId || null, // 모바일 앱 하드웨어 고유 단말기 식별 UUID 코드
    token: baseAppInfo.token || "", // 하이브리드 세션 자동 로그인 유도용 원격 네이티브 보관 암호 토큰 패킷
    screen: {
      width: screen.width || 0, // 하드웨어 디스플레이 가로 해상도 원품 픽셀
      height: screen.height || 0, // 하드웨어 디스플레이 세로 해상도 원품 픽셀
      pixelRatio:
        typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, // 모니터 고유 망막 레티나 고해상도 그래픽 밀도 배율 지수
    },
    viewport: {width, height}, // 실시간 가용 브라우저 안쪽 윈도우 스케일 사이즈
    compactBreakpoint, // 최종 대조 연산에 사용된 반응형 한계 임계선 중단점 픽셀 수치 정보
    updatedAt: new Date().toISOString(), // 플랫폼 스냅샷이 최종 빌드 및 리프레시 동기화 완료된 시간 타임스탬프 기록
  };
}
