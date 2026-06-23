/**
 * @file core/resolver/interceptor.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {isNativeApp} from "@/core/config/appConfig";
import {
  applyAuthRequestConfig,
  handleAuthResponseError,
  isAuthExpiredStatus,
} from "@/auth/httpAuthInterceptor";

/**
 * @description 일반 웹(Web) 브라우저 환경에서 작동하는 Axios 요청 인터셉터입니다. 로컬 스토리지에서 인증 토큰을 꺼내 헤더에 주입합니다.
 * @param {import('axios').AxiosInstance} instance - 인터셉터를 부착할 Axios 인스턴스
 * @returns {void}
 */
/**
 * 계산된 설정 또는 사용자 선택 값을 실제 상태/DOM에 적용합니다.
 */
function applyWebRequestInterceptor(instance) {
  instance.interceptors.request.use((config) => applyAuthRequestConfig(config));
}

/**
 * @description 하이브리드 네이티브 앱(Native App) 환경에서 작동하는 Axios 요청 인터셉터입니다. 네이티브 브릿지나 수임 정보에서 토큰을 추출하고 앱 환경 메타 헤더를 함께 주입합니다.
 * @param {import('axios').AxiosInstance} instance - 인터셉터를 부착할 Axios 인스턴스
 * @param {object} bridge - 안드로이드 네이티브 WebView 자바스크립트 인터페이스 브릿지 객체
 * @param {object} appInfo - 애플리케이션 코어 빌드 및 버전 정보 구조체
 * @returns {void}
 */
/**
 * 계산된 설정 또는 사용자 선택 값을 실제 상태/DOM에 적용합니다.
 */
function applyNativeRequestInterceptor(instance, bridge, appInfo) {
  instance.interceptors.request.use((config) => {
    config = applyAuthRequestConfig(config);

    // [원격 서버 분석 및 로그 수집용] 현재 구동 중인 앱의 네이티브 메타 데이터를 커스텀 X-헤더 파싱 영역에 영구 동기화
    config.headers["X-App-Version"] = appInfo?.appVersion || ""; // 앱 릴리스 버전 (예: 1.2.0)
    config.headers["X-App-Build-Version"] = appInfo?.appBuildVersion || ""; // 앱 바이너리 내부 빌드 번호
    config.headers["X-Bridge-Version"] = appInfo?.bridgeVersion || ""; // 웹뷰-네이티브간 통신 프로토콜 규격 버전

    return config;
  });
}

/**
 * @description 전역 HTTP 응답에 대한 가로채기(Interceptor)를 수행하여 401/403(인증 만료), 500대(서버 에러) 상태 코드를 일괄 모니터링하고 UI 경고창을 연동합니다.
 * @param {import('axios').AxiosInstance} instance - 인터셉터를 부착할 Axios 인스턴스
 * @param {object} errorUI - 전역 알림(Toast/Modal) 레이어를 트리거할 UI 가드 인스턴스 기구 컨텍스트
 * @returns {void}
 */
/**
 * 계산된 설정 또는 사용자 선택 값을 실제 상태/DOM에 적용합니다.
 */
function notifyHttpError(error, errorUI) {
  const status = error?.response?.status; // 인입된 HTTP Status Code 스캔

  // 인증 토큰/세션 만료 혹은 비인가 접근 제한 사태 발생 시
  if (isAuthExpiredStatus(status)) {
    errorUI?.notify?.("인증 정보가 만료되었습니다.");
  }

  // 백엔드 인프라 파이프라인 내부 코어 폭파 및 크래시 발생 시 (Internal Server Error)
  if (status >= 500) {
    errorUI?.notify?.("서버 오류가 발생했습니다.");
  }
}

function applyResponseInterceptor(instance, errorUI) {
  instance.interceptors.response.use(
    // 케이스 A: HTTP 상태 코드가 200~300대 정상 범위인 경우 가공 없이 응답 원본 본품을 그대로 패스 바이패스
    (response) => response,

    // 케이스 B: 백엔드 API 레이어에서 에러 예외 핸들링 판정이 반환되어 400~500대 코드가 인입된 경우
    async (error) => {
      // 인증 방식별 만료 처리(JWT refresh/retry, Session reset)는 auth strategy에 위임합니다.
      // JWT refresh 대상 401은 재시도 결과가 최종 실패로 확정된 뒤에만 알림을 표시해 중복/오탐 알림을 방지합니다.
      try {
        return await handleAuthResponseError(error, instance);
      } catch (finalError) {
        notifyHttpError(finalError, errorUI);
        return Promise.reject(finalError);
      }
    }
  );
}

/**
 * @function applyInterceptors
 * @description 외부에서 생성 및 주입된 단일 Axios 인스턴스 레이어에 기기 컨텍스트(웹 vs 네이티브 앱) 분기 로직과 공통 응답 에러 모니터링 가드를 통합 연계 개통하는 오케스트레이터 함수입니다.
 * @param {import('axios').AxiosInstance} instance - 초기화 완료 상태의 타깃 Axios 통신 인스턴스 본품
 * @param {object} appInfo - 런타임 탐색기(PlatformDetector) 등이 생성한 물리 디바이스 환경 메타데이터 구조체
 * @param {object} [context={}] - 하이브리드 브릿지 및 UI 알림 알람 개통 버스를 보존한 의존성 주입 구조체 체인
 * @param {object} [context.bridge] - 네이티브 브릿지 인터페이스 버스 포인터 스캔
 * @param {object} [context.errorUI] - 화면 알림창 연동용 컴포넌트 핸들러 메서드 팩
 * @returns {void}
 */
export function applyInterceptors(instance, appInfo, context = {}) {
  const {bridge, errorUI} = context;

  // 1. [요청 인터셉터 분기 가동] 플랫폼 탐색 결과 앱 패키지 설치형(isNativeApp) 런타임 환경인지 대조 판별
  if (isNativeApp(appInfo)) {
    // 앱 전용 인터셉터 가동: 네이티브 브릿지 메모리 노크 버스 및 하드웨어 버전 헤더 세트 주입
    applyNativeRequestInterceptor(instance, bridge, appInfo);
  } else {
    // 범용 모바일 웹 / 데스크톱 웹 환경: 표준 스토리지 영역을 참조하여 웹 전용 토큰 바인딩 수립
    applyWebRequestInterceptor(instance);
  }

  // 2. [응답 인터셉터 공통 개통] 통신 성공/실패 여부를 인터셉트하여 전역 토스트 팝업 제어 레이어 장착 단행
  applyResponseInterceptor(instance, errorUI);
}
