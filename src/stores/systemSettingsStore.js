/**
 * @file stores/systemSettingsStore.js
 * @description Pinia 전역 상태 저장소입니다. 화면 간 공유되어야 하는 business/runtime 상태를 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {defineStore} from "pinia";
import {
  DEFAULT_SYSTEM_SETTINGS,
  normalizeSystemSettings,
} from "@/constants/systemSettings";
import {logPlatformDebug} from "@/platform/platformDebug";

/**
 * @description 관리자 제어 패널 설정 프리셋, 가상 키보드 높이 조율 임계치, API 더미/실서버 통신 분기 플래그,
 * 그리고 모바일 전용 UI 제약 가드 사양 등의 전역 '시스템 환경 프리셋' 레이어를 총괄 소유 보존하는 스토어입니다.
 */
export const useSystemSettingsStore = defineStore("systemSettings", {
  // 영구 불변 상수를 기반으로 개통 세팅된 하드웨어/UI 조율 프리셋 세션 상태 구조 명세
  state: () => ({
    settings: {...DEFAULT_SYSTEM_SETTINGS}, // 정규화 연산을 마친 최종 시스템 제어 파라미터 맵
    hydrated: false, // 로컬 스토리지 캐시 등으로부터 데이터 하이드레이션 주입 매운 작업 완결 여부 플래그
  }),
  getters: {
    // 목업 API 인터페이스를 우회 바이패스하고 실제 원격 운영 서버 엔드포인트 게이트웨이로 물리 패킷을 쏠지 여부 판별식
    useRealApi: (state) => state.settings.useRealApi,
    // 디버거 유저가 개발자 대시보드에서 강제 에뮬레이팅 설정해 둔 기기 임시 덮어쓰기 플랫폼 코드 키 사양
    platformOverride: (state) => state.settings.platformOverride,
    // 모바일 전용 특화 바텀시트 UI 레이아웃 모드로 압축 스위칭할 윈도우 너비(Width) 임계 기준 픽셀 치수
    mobileBreakpoint: (state) => state.settings.mobileBreakpoint,
    // 엔터키 전송 모드, 혹은 개행(Shift+Enter) 입력 모드 등 하드웨어 자판 인터랙션 동작 가이드라인 규격 사양
    keyboardMode: (state) => state.settings.keyboardMode,
    // 모바일 브라우저의 불안정한 웹뷰 가상 소프트 자판을 대행할 HTML 기반 하이브리드 커스텀 가상 자판 레이어 시동 점등 여부 플래그
    useVirtualKeyboard: (state) => state.settings.useVirtualKeyboard,
    // 가상 소프트웨어 키보드 엔진 레이아웃의 디버그 픽셀 경계선 가이드 뷰를 노출 점등할지 플래그
    showVirtualKeyboardDebug: (state) =>
      state.settings.showVirtualKeyboardDebug,
    // 현재 활성화 수립 상태인 가상 키보드가 강제 점유 장악해야 할 물리 수직 높이 치수 픽셀 가이드라인
    virtualKeyboardHeight: (state) => state.settings.virtualKeyboardHeight,
    // 하단에서 뿜어져 나오는 모바일 전용 설정창 바텀시트 레이어의 최소 물리 스크린 확장 제한 픽셀 수치
    bottomSheetMinHeight: (state) => state.settings.bottomSheetMinHeight,
    // 하단 모바일 바텀시트가 화면 본문을 과도하게 가리지 않도록 상한선을 제어하는 최대 가로 확장 제한 픽셀 높이 수치
    bottomSheetMaxHeight: (state) => state.settings.bottomSheetMaxHeight,
    // 웹 오디오 음성 인식 마이크 기능 모듈 탑재 및 활성 단추 인프라 노출 여부 가드 플래그
    useMicrophone: (state) => state.settings.useMicrophone,
    // 툴바 탭 단에 초보자용 프롬프트 튜토리얼 사용법 퀵 가이드 컴포넌트 팝업 단추를 드로잉할지 여부
    showGuideButton: (state) => state.settings.showGuideButton,
    // 화면 테마 스위처(다크 모드 / 라이트 모드 변경 단추) 가시성 플래그
    showThemeButton: (state) => state.settings.showThemeButton,
    // 사내 개발자 및 테스터용 기술 명세 문서 바로가기 링크 단추 점등 플래그
    showSwaggerButton: (state) => state.settings.showSwaggerButton,
    // 서비스 마스터 공지사항 알림 보드 메뉴 활성 플래그
    showNoticeMenu: (state) => state.settings.showNoticeMenu,
    // 법적 보호 정책 고지 메뉴 노출 플래그
    showPrivacyMenu: (state) => state.settings.showPrivacyMenu,
    // 서비스 표준 이용 약관 안내 보드 가시성 플래그
    showTermsMenu: (state) => state.settings.showTermsMenu,
    // AI 개인화 맞춤형 하이퍼 파라미터 튜닝 보드 메뉴 활성 플래그
    showPersonalizationMenu: (state) => state.settings.showPersonalizationMenu,
    // LLM 원시 플레이그라운드 테스트 샌드박스 룸 진입 숏컷 메뉴 활성 플래그
    showPlaygroundMenu: (state) => state.settings.showPlaygroundMenu,
    // 세션 종료 로그아웃 단추 UI 기식화 플래그
    showLogoutButton: (state) => state.settings.showLogoutButton,
    // PC 플랫폼에서 전역 ProgressBar 표시를 허용할지 여부
    showPcProgress: (state) => state.settings.showPcProgress,
    // 모바일 플랫폼에서 전역 ProgressBar 표시를 허용할지 여부
    showMobileProgress: (state) => state.settings.showMobileProgress,
    // AI의 답변 토큰이 실시간 분출 타이핑 출력될 때 메인 대화 스크롤바 영역을 화면 하단 꼬리로 완전 자동 연속 동적 추적 다운시킬지 판별식
    autoScrollOnAnswer: (state) => state.settings.autoScrollOnAnswer,
    conversationUrlMode: (state) => state.settings.conversationUrlMode,
    showMermaidHeader: (state) => state.settings.showMermaidHeader,
    enableMermaidRendering: (state) => state.settings.enableMermaidRendering,
    pcShowMermaidHeader: (state) => state.settings.pcShowMermaidHeader,
    pcEnableMermaidRendering: (state) =>
      state.settings.pcEnableMermaidRendering,
    mobileShowMermaidHeader: (state) => state.settings.mobileShowMermaidHeader,
    mobileEnableMermaidRendering: (state) =>
      state.settings.mobileEnableMermaidRendering,
    historyLazyChunkSize: (state) => state.settings.historyLazyChunkSize,
    historyLazyTopThreshold: (state) => state.settings.historyLazyTopThreshold,
    pcHistoryLazyInitialCount: (state) =>
      state.settings.pcHistoryLazyInitialCount,
    pcHistoryLazyAppendCount: (state) =>
      state.settings.pcHistoryLazyAppendCount,
    pcHistoryLazyTopThresholdPx: (state) =>
      state.settings.pcHistoryLazyTopThresholdPx,
    mobileHistoryLazyInitialCount: (state) =>
      state.settings.mobileHistoryLazyInitialCount,
    mobileHistoryLazyAppendCount: (state) =>
      state.settings.mobileHistoryLazyAppendCount,
    // 임직원이 AI 질문 답변 연산 대기 도중 스마트폰 홈 버튼을 누르거나 타 전하 앱 통화 모션 등으로
    // 브라우저가 백그라운드로 소외 이탈(무효 유휴 세션 진입)했을 때 진행 중인 무거운 거대 AI 통신 토큰 세션을 리소스 절약을 위해 즉각 강제 폭파 낙태 취소(Abort)시킬지 여부
    abortChatOnMobileBackground: (state) =>
      state.settings.abortChatOnMobileBackground,
    webAuthMode: (state) => state.settings.webAuthMode,
    mobileAuthMode: (state) => state.settings.mobileAuthMode,
    webLoginUrl: (state) => state.settings.webLoginUrl,
    mobileLoginUrl: (state) => state.settings.mobileLoginUrl,
    tempLoginUrl: (state) => state.settings.tempLoginUrl,
    accessInfoUrl: (state) => state.settings.accessInfoUrl,
    logoutUrl: (state) => state.settings.logoutUrl,
    jwtRefreshUrl: (state) => state.settings.jwtRefreshUrl,
    jwtWithCredentials: (state) => state.settings.jwtWithCredentials,
  },
  actions: {
    /**
     * @function init
     * @description 최초 서비스 시동 시점에 시스템 하드웨어 기본 프리셋을 상수가 정한 무결성 규격 사양에 입각하여 빌드 규격화 정규화 패치 수립합니다.
     */
    init() {
      this.settings = normalizeSystemSettings(this.settings); // 안전 보정 정규화
      this.hydrated = true; // 사용 가동 완결 마킹 공표
    },
    /**
     * @function applySettings
     * @description 원격지 어드민 설정 콘솔 등에서 프리셋 사양이 변경 패치되어 날아왔을 때 변경분을 실시간 병합 정규화 전파 동기화합니다.
     * @param {object} nextSettings - 새로 하달되어 엎어쳐질 타깃 신규 시스템 프리셋 구조체 오브젝트
     */
    applySettings(nextSettings) {
      const previous = {...this.settings}; // 이전 디버그 정보 대조용 얕은 카피 본 백업 복제
      this.settings = normalizeSystemSettings(nextSettings); // 정규화 규격 포맷 빌드 주입
      this.hydrated = true;

      // 하드웨어 로깅 모듈을 가동하여 중단점 변경 히스토리를 물리 콘솔 로그 버스 파이프라인에 영구 기록 박제 처리합니다.
      logPlatformDebug("settings.apply", {
        previous: {
          platformOverride: previous.platformOverride,
          mobileBreakpoint: previous.mobileBreakpoint,
        },
        next: {
          platformOverride: this.settings.platformOverride,
          mobileBreakpoint: this.settings.mobileBreakpoint,
        },
      });
    },
  },
});
