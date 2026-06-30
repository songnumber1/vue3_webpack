/**
 * @file api/clients/httpClient.js
 * @description Axios 인스턴스를 커스텀 래핑하여 전역 API 통신의 공통 Base URL 설정, 타임아웃, 자격 증명(Credentials), 인터셉터를 통한 비동기 요청 취소(AbortController) 관리 및 모바일 progress 오버레이 연동을 일괄 제어하는 비동기 통신 코어 모듈입니다.
 */

import axios from "axios";
import {
  DEFAULT_API_BASE_PATH,
  shouldUseServerApi,
  SERVER_API_BASE_URL,
} from "@/constants/apiMode";
import {resolveApiPolicy} from "@/constants/apiConfig";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {usePlatformStore} from "@/stores/platformStore";
import {isProgressAllowedForCurrentPlatform} from "@/constants/chatRuntimePolicy";
import {
  applySessionRequestConfig,
  handleSessionAuthError,
} from "@/auth/httpAuthInterceptor";
import {createId} from "@/utils/id";

/**
 * @description 현재 애플리케이션의 런타임 환경 변수 및 설정 스토어의 API 모드 점등 유무를 대조하여 Axios 요청에 주입할 최적의 베이스 프록시 엔드포인트 URL 주소를 도출합니다.
 * @returns {string} 최종 확정된 API 통신용 도메인 Base URL
 */
function resolveBaseURL() {
  // 인라인 상용/테스트 실서버 API 강제 연동 조건이 켜져 있는 경우 전용 게이트웨이 주소 우선 반환
  if (shouldUseServerApi()) {
    return SERVER_API_BASE_URL;
  }

  // 기본적으로 환경 변수(`VUE_APP_API_BASE_URL`)를 추적하되, 유실 시 로컬 프록시 패스인 `"/api"`를 기본 바인딩
  return process.env.VUE_APP_API_BASE_URL || DEFAULT_API_BASE_PATH;
}

/**
 * @description 특정 API 키에 선언된 개별 정책(Policy)과 시스템 설정/플랫폼 스토어를 대조하여, 네트워크 통신 도중 ProgressBar를 표시할지 판별합니다.
 * @param {object} policy - `resolveApiPolicy` 파이프라인에서 추출된 해당 API의 정책 규격 객체
 * @returns {boolean} 전역 ProgressBar 가동 여부 플래그
 */

function getApiRequestStore() {
  return useApiRequestStore();
}

function shouldShowOverlay(policy) {
  try {
    if (!policy.overlay) return false;
    const platformStore = usePlatformStore();

    return isProgressAllowedForCurrentPlatform(platformStore.info);
  } catch (_error) {
    // Pinia 스토어 활성화 전 시점 등 초기 부트스트랩 에러 발생 시 예외 크래시 방지를 위해 false 가드 처리
    return false;
  }
}

/**
 * @description API 개별 정책에 따른 동적 비동기 요청 취소 파이프라인 개통을 위해 네이티브 `AbortController` 인스턴스를 조건부 생성합니다.
 * @param {object} policy - 해당 API 고유의 차단/취소 제어 정책 객체
 * @param {import("axios").InternalAxiosRequestConfig} config - 현재 실행 단계를 밟고 있는 Axios 요청 설정 컨테이너
 * @returns {AbortController|null} 인스턴스 개통 성공 시 AbortController 객체, 불필요 혹은 미지원 시 null
 */
function createAbortController(policy, config) {
  // 정책상 명시적 중도 취소가 비활성화되어 있거나 이미 외부 호출부에서 커스텀 시그널을 주입한 경우 가드 분기 차단
  if (!policy.abort || config.signal) return null;
  // Node.js 일부 구형 백엔드 SSR 컨텍스트 등 전역 AbortController가 실종된 특수 환경 가드 처리
  if (typeof AbortController === "undefined") return null;
  return new AbortController();
}

/**
 * @description 전역 공통 인터셉터 로직(추적 키 발급, Abort 시그널 동기화, 로딩 바 온오프 마킹)이 주입된 완제품 형태의 커스텀 Axios 클라이언트를 설계 및 조립합니다.
 * @returns {import("axios").AxiosInstance} 설정 및 라이프사이클 훅 조립이 완료된 Axios 인스턴스 본품
 */
export function createHttpClient() {
  // 1. 공통 환경 변수 및 타임아웃 규격을 바인딩한 코어 인스턴스 1차 빌드 단행
  const client = axios.create({
    baseURL: resolveBaseURL(),
    timeout: Number(process.env.VUE_APP_API_TIMEOUT || 15000), // 렌더링 지연 방지를 위해 기본 15초 타임아웃 락인
    withCredentials: true, // session cookie 인증 고정
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 2. [Request Interceptor] 네트워크 패킷이 브라우저 밖으로 방출되기 직전에 거치는 전처리 관문 개통
  client.interceptors.request.use((config) => {
    config = applySessionRequestConfig(config);
    const apiPolicy = resolveApiPolicy(config.apiKey);
    const apiRequestStore = getApiRequestStore();

    // 요청 고유 식별자(Request Key) 난수 조합 생성: 동시 다발적 중복 요청 트래킹 및 특정 요청 타깃 중도 abort 저격을 위함
    const requestKey = createId();
    const controller = createAbortController(apiPolicy, config);
    const overlay = shouldShowOverlay(apiPolicy);

    // 런타임 유연 대응을 위한 베이스 주소 최신화 및 인터셉터 통과 증적 메타 필드 은닉 주입
    config.baseURL = resolveBaseURL();
    config.__apiRequestKey = requestKey;
    config.__apiOverlay = overlay;

    // 비동기 요청 취소 시그널 결합 처리 및 ApiRequestStore 레지스트리에 영구 컨트롤러 등록
    if (controller) {
      config.signal = controller.signal;
      apiRequestStore.registerController(requestKey, controller);
    }
    // 모바일 오버레이 점등 대상일 경우 중앙 오버레이 카운터 업 시퀀스 발동
    if (overlay) {
      apiRequestStore.startOverlay();
    }

    return config;
  });

  // 3. [Response Interceptor] 서버로부터 HTTP 응답 패킷이 인입된 직후 혹은 네트워크 크래시 발생 시 거치는 후처리 관문 개통
  client.interceptors.response.use(
    (response) => {
      const apiRequestStore = getApiRequestStore();

      // 통신 정상 완수 시 등록해 두었던 컨트롤러를 메모리 누수 방지 차원에서 레지스트리 목록에서 즉각 소멸 격리
      apiRequestStore.unregisterController(response.config?.__apiRequestKey);

      // 해당 요청이 로딩바를 점등했던 건이라면 모바일 오버레이 카운터 다운 세틀먼트 이행
      if (response.config?.__apiOverlay) apiRequestStore.stopOverlay();

      return response;
    },
    (error) => {
      const apiRequestStore = getApiRequestStore();

      // 404, 500 에러 혹은 하드웨어 타임아웃, Abort 중도 차단 등으로 인해 통신이 파손되더라도 동일하게 메모리 클린업 파이프라인 수행
      apiRequestStore.unregisterController(error.config?.__apiRequestKey);
      if (error.config?.__apiOverlay) apiRequestStore.stopOverlay();

      return handleSessionAuthError(error, client);
    }
  );

  return client;
}

/**
 * @type {import("axios").AxiosInstance}
 * @description 애플리케이션 전역에서 싱글톤으로 인포트하여 즉시 원격지 통신에 활용할 수 있는 표준 정형화 HTTP 클라이언트 인스턴스 에셋입니다.
 */
export const httpClient = createHttpClient();

/**
 * @description Axios Response 통체 내부에서 핵심 JSON Payload 비즈니스 데이터 도메인만 안전하게 압축 해제하고, 유실 및 오류 발생 시 준비된 디폴트 대체제를 반환합니다.
 * @param {import("axios").AxiosResponse} response - Axios 통신 성공 후 반환된 HTTP 응답 객체 전체
 * @param {*} fallback - `response.data` 필드가 Nullish 처리되어 있을 경우 우회 반환할 기본 데이터 구조 본품
 * @returns {*} 언랩핑이 완료된 원품 데이터 혹은 대안 폴백 구조체
 */
export function unwrapResponseData(response, fallback) {
  return response?.data ?? fallback;
}
