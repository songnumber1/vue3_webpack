/**
 * @file constants/systemSettings.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

// 일반적인 모바일 터치 디바이스 판정 기준 가로폭 해상도 (768px)
export const DEFAULT_MOBILE_BREAKPOINT_PX =
  process.env.VUE_APP_SYSTEM_MOBILE_BREAKPOINT;

// 사용자가 설정할 수 있는 모바일 전환 기준 너비의 최소/최대 허용 범위
export const MIN_MOBILE_BREAKPOINT_PX = 400;
export const MAX_MOBILE_BREAKPOINT_PX = 9999;

// 하위 호환성을 위해 기존 export 명칭은 유지하되, 더 이상 플랫폼 오버라이드 여부로 강제 적용하지 않습니다.
export const FORCED_MOBILE_PLATFORM_BREAKPOINT_PX = MAX_MOBILE_BREAKPOINT_PX;

/**
 * 모바일 가상 키보드가 전격 팝업될 때 화면 뷰포트를 어떤 레이아웃 공식으로 반응형 밀어내기 처리할지 규정하는 불변 모드 상수입니다.
 */
export const KEYBOARD_MODES = Object.freeze({
  adjustNothing: "adjustNothing", // 아키텍처 옵션 1: 아무런 높이 보정도 수행하지 않는 모드
  adjustPan: "adjustPan", // 아키텍처 옵션 2: 브라우저 네이티브 초점 포커싱 이동 스크롤만 의존하는 모드
  adjustResize: "adjustResize", // 아키텍처 옵션 3: 뷰포트 높이 자체를 축소하고 내부 CSS 변수를 연동 보정하는 모드
});

/**
 * 개발 환경 런타임 설정 대시보드 템플릿 영역의 셀렉트 박스 라벨 및 상세 기술 내역 바인딩용 옵션 데이터 셋입니다.
 */
export const KEYBOARD_MODE_OPTIONS = Object.freeze([
  {
    value: KEYBOARD_MODES.adjustResize,
    label: "adjustResize + CSS",
    description: "헤더는 고정하고 컨텐츠/입력 영역을 CSS 변수로 보정합니다.",
  },
  {
    value: KEYBOARD_MODES.adjustPan,
    label: "adjustPan",
    description:
      "CSS resize 보정 없이 포커스 입력 영역으로 스크롤 이동만 시도합니다.",
  },
  {
    value: KEYBOARD_MODES.adjustNothing,
    label: "adjustNothing",
    description: "키보드 높이 보정과 자동 스크롤 이동을 적용하지 않습니다.",
  },
]);

/**
 * 디버깅 또는 QA 검증을 위해 개발자가 PC 웹 브라우저에서도 강제로 안드로이드 네이티브 에이전트 다이어그램 분기를 시뮬레이션할 수 있도록 지원하는 모드 상수 세트입니다.
 */
export const PLATFORM_OVERRIDE_MODES = Object.freeze({
  auto: "auto", // 탐색 분기: UserAgent 커널을 완전 수동/자동으로 내장 추적 판별
  androidChrome: "android-chrome", // 탐색 분기: 강제 모바일 크롬 브라우저 타깃 고정 분기 활성화
  androidWebView: "android-webview", // 탐색 분기: 강제 안드로이드 인앱 하이브리드 웹뷰 타깃 고정 분기 활성화
});

/**
 * 플랫폼 오버라이드 셀렉터 컴포넌트 데이터 하이드레이션 딕셔너리 배열입니다.
 */

/**
 * @description Vue CLI 환경 변수 문자열을 불리언 값으로 안전하게 변환합니다.
 * @param {string|undefined|null} value - process.env로부터 읽은 원시 문자열 값
 * @param {boolean} fallback - 값이 비어있을 때 사용할 기본값
 * @returns {boolean} 파싱된 불리언 값
 */
function readBooleanEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["true", "1", "yes", "y", "on"].includes(
    String(value).trim().toLowerCase()
  );
}

/**
 * @description Vue CLI 환경 변수 문자열을 숫자 값으로 안전하게 변환합니다.
 * @param {string|undefined|null} value - process.env로부터 읽은 원시 문자열 값
 * @param {number} fallback - 값이 비어있거나 숫자가 아닐 때 사용할 기본값
 * @returns {number} 파싱된 숫자 값
 */
function readNumberEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

/**
 * @description Vue CLI 환경 변수 문자열을 안전하게 읽어 빈 값이면 기본값으로 되돌립니다.
 * @param {string|undefined|null} value - process.env로부터 읽은 원시 문자열 값
 * @param {string} fallback - 값이 비어있을 때 사용할 기본값
 * @returns {string} 최종 문자열 값
 */
function readStringEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

export const PLATFORM_OVERRIDE_OPTIONS = Object.freeze([
  {
    value: PLATFORM_OVERRIDE_MODES.auto,
    label: "Auto",
    description: "현재 브라우저/앱 환경을 자동으로 판별합니다.",
  },
  {
    value: PLATFORM_OVERRIDE_MODES.androidChrome,
    label: "Android Chrome",
    description:
      "웹 브라우저에서도 Android Chrome 모바일 브라우저 분기를 적용합니다.",
  },
  {
    value: PLATFORM_OVERRIDE_MODES.androidWebView,
    label: "Android WebView",
    description:
      "웹 브라우저에서도 Android WebView 유사 분기를 적용합니다. Native Bridge는 실제 앱에서만 호출됩니다.",
  },
]);

/**
 * 전체 로컬 스토리지 데이터 적재 및 API 패킷 직렬화 매핑 시 오타로 인한 런타임 참사를 차단하기 위해 유일 출처로 정의된 키 상수의 묶음 집합입니다.
 */
export const SYSTEM_SETTING_KEYS = Object.freeze({
  useRealApi: "useRealApi", // 실서버 백엔드 연동 vs 가상 Mock 모킹 API 활성화 플래그
  platformOverride: "platformOverride", // 타깃 플랫폼 강제 모드 스위치
  mobileBreakpoint: "mobileBreakpoint", // 화면 분기 미디어 쿼리 픽셀 기준점 수치
  keyboardMode: "keyboardMode", // 가상 키보드 뷰포트 압착 알고리즘 종류
  useVirtualKeyboard: "useVirtualKeyboard", // 가상 웹 키보드 오버레이 적용 여부
  showVirtualKeyboardDebug: "showVirtualKeyboardDebug", // 하단 가상 키보드 높이 트래킹 디버그 패널 노출 여부
  virtualKeyboardHeight: "virtualKeyboardHeight", // 계산된 기본 모바일 소프트웨어 키보드 영역 디폴트 높이 수치
  bottomSheetMinHeight: "bottomSheetMinHeight", // 채팅방 하단 도구 바텀시트 가용 최소 높이 수치
  bottomSheetMaxHeight: "bottomSheetMaxHeight", // 채팅방 하단 도구 바텀시트 가용 최대 높이 수치
  useMicrophone: "useMicrophone", // 음성 인식(STT) 마이크 하드웨어 모듈 인앱 접근 권한 플래그
  showGuideButton: "showGuideButton", // 메뉴 드로어 내 가이드 가시성 토글 플래그
  showThemeButton: "showThemeButton", // 테마 토글 버튼 노출 여부
  showSwaggerButton: "showSwaggerButton", // Swagger 문서 이동 링크 활성화 여부
  showNoticeMenu: "showNoticeMenu", // 공지사항 모달 오픈용 아이콘 가시성 여부
  showPrivacyMenu: "showPrivacyMenu", // 개인정보방침 모달 메뉴 가시성 여부
  showTermsMenu: "showTermsMenu", // 이용약관 페이지 이동 메뉴 가시성 여부
  showPersonalizationMenu: "showPersonalizationMenu", // 개인화 마이페이지 환경설정 노출 플래그
  showPlaygroundMenu: "showPlaygroundMenu", // 프롬프트 실험실 메뉴 가시성 플래그
  showLogoutButton: "showLogoutButton", // 인증 세션 로그아웃 버튼 노출 여부
  showMobileApiProgress: "showMobileApiProgress", // 모바일 화면 상단에 미세 API 게이지 바 노출 처리 여부
  autoScrollOnAnswer: "autoScrollOnAnswer", // AI 실시간 타이핑 스트리밍 출력 시 스크롤 하단 밀어내기 자동 추적 옵션
  abortChatOnMobileBackground: "abortChatOnMobileBackground", // 모바일 환경에서 사용자가 홈 화면으로 빠져나가 백그라운드로 전환될 때 통신 파괴 여부
});

/**
 * 인앱 대시보드 저장소에 아무런 데이터 설정 메타 정보가 매핑되지 않았을 때 수립되는 절대 보정 디폴트 기준 데이터 테이블 세트입니다.
 */
export const DEFAULT_SYSTEM_SETTINGS = Object.freeze({
  [SYSTEM_SETTING_KEYS.useRealApi]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_USE_REAL_API,
    true
  ),
  [SYSTEM_SETTING_KEYS.platformOverride]: readStringEnv(
    process.env.VUE_APP_SYSTEM_PLATFORM_OVERRIDE,
    PLATFORM_OVERRIDE_MODES.auto
  ),
  [SYSTEM_SETTING_KEYS.mobileBreakpoint]: readNumberEnv(
    process.env.VUE_APP_SYSTEM_MOBILE_BREAKPOINT,
    DEFAULT_MOBILE_BREAKPOINT_PX
  ),
  [SYSTEM_SETTING_KEYS.keyboardMode]: readStringEnv(
    process.env.VUE_APP_SYSTEM_KEYBOARD_MODE,
    KEYBOARD_MODES.adjustResize
  ),
  [SYSTEM_SETTING_KEYS.useVirtualKeyboard]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_USE_VIRTUAL_KEYBOARD,
    true
  ),
  [SYSTEM_SETTING_KEYS.showVirtualKeyboardDebug]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_SHOW_VIRTUAL_KEYBOARD_DEBUG,
    false
  ),
  [SYSTEM_SETTING_KEYS.virtualKeyboardHeight]: readNumberEnv(
    process.env.VUE_APP_SYSTEM_VIRTUAL_KEYBOARD_HEIGHT,
    340
  ),
  [SYSTEM_SETTING_KEYS.bottomSheetMinHeight]: readNumberEnv(
    process.env.VUE_APP_SYSTEM_BOTTOM_SHEET_MIN_HEIGHT,
    260
  ),
  [SYSTEM_SETTING_KEYS.bottomSheetMaxHeight]: readNumberEnv(
    process.env.VUE_APP_SYSTEM_BOTTOM_SHEET_MAX_HEIGHT,
    720
  ),
  [SYSTEM_SETTING_KEYS.useMicrophone]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_USE_MICROPHONE,
    false
  ),
  [SYSTEM_SETTING_KEYS.showGuideButton]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_SHOW_GUIDE_BUTTON,
    false
  ),
  [SYSTEM_SETTING_KEYS.showThemeButton]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_SHOW_THEME_BUTTON,
    false
  ),
  [SYSTEM_SETTING_KEYS.showSwaggerButton]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_SHOW_SWAGGER_BUTTON,
    false
  ),
  [SYSTEM_SETTING_KEYS.showNoticeMenu]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_SHOW_NOTICE_MENU,
    true
  ),
  [SYSTEM_SETTING_KEYS.showPrivacyMenu]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_SHOW_PRIVACY_MENU,
    true
  ),
  [SYSTEM_SETTING_KEYS.showTermsMenu]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_SHOW_TERMS_MENU,
    true
  ),
  [SYSTEM_SETTING_KEYS.showPersonalizationMenu]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_SHOW_PERSONALIZATION_MENU,
    true
  ),
  [SYSTEM_SETTING_KEYS.showPlaygroundMenu]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_SHOW_PLAYGROUND_MENU,
    false
  ),
  [SYSTEM_SETTING_KEYS.showLogoutButton]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_SHOW_LOGOUT_BUTTON,
    true
  ),
  [SYSTEM_SETTING_KEYS.showMobileApiProgress]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_SHOW_MOBILE_API_PROGRESS,
    true
  ),
  [SYSTEM_SETTING_KEYS.autoScrollOnAnswer]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_AUTO_SCROLL_ON_ANSWER,
    false
  ),
  [SYSTEM_SETTING_KEYS.abortChatOnMobileBackground]: readBooleanEnv(
    process.env.VUE_APP_SYSTEM_ABORT_CHAT_ON_MOBILE_BACKGROUND,
    true
  ),
});

/**
 * 외부 입력 또는 API 응답을 내부 화면 모델에 맞게 정규화합니다.
 */
function normalizePlatformOverride(value) {
  // 주입받은 원시 문자열 데이터가 가용 상수의 유효 범위 밸류 집합에 들어있는지 확인 후, 유효하지 않다면 시스템 기본 오토(auto) 모드로 강제 회귀 보정
  return Object.values(PLATFORM_OVERRIDE_MODES).includes(value)
    ? value
    : DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.platformOverride];
}

/**
 * 외부 입력 또는 API 응답을 내부 화면 모델에 맞게 정규화합니다.
 */
function normalizeKeyboardMode(value) {
  // 주입받은 가상 키보드 제어 코드가 승인된 3종 모드 안에 속해 있는지 검증 후 유실 시 디폴트 압착(adjustResize) 정책으로 백업 세팅
  return Object.values(KEYBOARD_MODES).includes(value)
    ? value
    : DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.keyboardMode];
}

/**
 * @description 로컬 스토리지의 위변조된 데이터나 백엔드에서 내려온 불안정한 타입의 설정 객체를 인입받아, 비즈니스 한계 영역 규격에 맞춰 안전 범위(Min/Max Clamp)로 치환 정규화해주는 무결성 방어 마스터 함수입니다.
 * @param {object} [value={}] 외부 서버 또는 저장소로부터 추출된 미검증 가변 시스템 설정 로우 객체
 * @returns {object} 자바스크립트 논리 파괴 및 폭포수 렌더링 에러를 예방할 수 있게 보정 완성된 완전무결 설정 팩
 */
export function normalizeSystemSettings(value = {}) {
  const source = value && typeof value === "object" ? value : {}; // 데이터 유효 타입 세이프 검증
  const next = {...DEFAULT_SYSTEM_SETTINGS}; // 원본 보존 및 가변 조작을 위한 베이스 디폴트 프로토타입 디프 카피 스냅샷 생성

  Object.keys(DEFAULT_SYSTEM_SETTINGS).forEach((key) => {
    if (!(key in source)) return; // 원본 소스에 해당 옵션 조절 레버 키가 없다면 패스하고 시스템 기본값 유지 채택

    // 세부 정규화 1구역: 모바일 해상도 트리거 포인트 정밀 클램프 연산
    if (key === SYSTEM_SETTING_KEYS.mobileBreakpoint) {
      const numeric = Number(source[key]);
      next[key] = Number.isFinite(numeric)
        ? Math.min(
            Math.max(Math.round(numeric), MIN_MOBILE_BREAKPOINT_PX),
            MAX_MOBILE_BREAKPOINT_PX
          ) // 해상도가 비정상적으로 깨지는 현상을 막기 위해 최소 400px에서 최대 9999px로 범위 강제 잠금(Clamp)
        : DEFAULT_SYSTEM_SETTINGS[key];
      return;
    }

    // 세부 정규화 2구역: 수동 플랫폼 오버라이드 유효 구문 대조
    if (key === SYSTEM_SETTING_KEYS.platformOverride) {
      next[key] = normalizePlatformOverride(source[key]);
      return;
    }

    // 세부 정규화 3구역: 가상 키보드 뷰포트 충돌 알고리즘 유형 유효 구문 대조
    if (key === SYSTEM_SETTING_KEYS.keyboardMode) {
      next[key] = normalizeKeyboardMode(source[key]);
      return;
    }

    // 세부 정규화 4구역: 모바일 하단 가상 소프트웨어 키보드 가상 공간 영역 높이값 세이프 가드 (최소 180px ~ 최대 600px 제한)
    if (key === SYSTEM_SETTING_KEYS.virtualKeyboardHeight) {
      const numeric = Number(source[key]);
      next[key] = Number.isFinite(numeric)
        ? Math.min(Math.max(Math.round(numeric), 180), 600)
        : DEFAULT_SYSTEM_SETTINGS[key];
      return;
    }

    // 세부 정규화 5구역: 설정 패널 및 파일 업로드 콤보 팝업 시트 바텀시트 가용 최소 높이 클램프 (180px ~ 720px 제한)
    if (key === SYSTEM_SETTING_KEYS.bottomSheetMinHeight) {
      const numeric = Number(source[key]);
      next[key] = Number.isFinite(numeric)
        ? Math.min(Math.max(Math.round(numeric), 180), 720)
        : DEFAULT_SYSTEM_SETTINGS[key];
      return;
    }

    // 세부 정규화 6구역: 설정 패널 및 파일 업로드 콤보 팝업 시트 바텀시트 가용 최대 높이 클램프 (320px ~ 960px 제한)
    if (key === SYSTEM_SETTING_KEYS.bottomSheetMaxHeight) {
      const numeric = Number(source[key]);
      next[key] = Number.isFinite(numeric)
        ? Math.min(Math.max(Math.round(numeric), 320), 960)
        : DEFAULT_SYSTEM_SETTINGS[key];
      return;
    }

    // 세부 정규화 7구역: 수치형을 제외한 나머지 범용 온오프 플래그 옵션들은 불리언 데이터 타입(Boolean)으로 강제 변환 규격화 마감
    next[key] = Boolean(source[key]);
  });

  // 반응형 전환 기준 너비는 플랫폼 오버라이드(auto/android...) 상태와 무관하게 사용자가 입력한 값을 유지합니다.
  // 단, 비정상적인 레이아웃 붕괴를 막기 위해 400px ~ 9999px 범위로만 보정합니다.

  // [수학적 모순 차단 가드]: 만약 오염된 데이터가 침투하여 바텀시트 최대 제한 높이가 최소 제한 높이보다 작아지는 기하학적 역전 레이아웃 왜곡 현상이 포착되면,
  // 최대 높이를 최소 높이 수치와 강제 수평 동기화 셋업시킴으로써 화면이 반대로 일그러지거나 돔이 뒤집히는 그래픽 버그를 완전히 방어합니다.
  if (
    next[SYSTEM_SETTING_KEYS.bottomSheetMaxHeight] <
    next[SYSTEM_SETTING_KEYS.bottomSheetMinHeight]
  ) {
    next[SYSTEM_SETTING_KEYS.bottomSheetMaxHeight] =
      next[SYSTEM_SETTING_KEYS.bottomSheetMinHeight];
  }

  // 데이터 무결성 세척이 종결된 완벽한 설정 스냅샷 오브젝트 최종 반환
  return next;
}
