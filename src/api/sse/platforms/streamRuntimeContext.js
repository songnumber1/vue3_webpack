/**
 * @file api/sse/platforms/streamRuntimeContext.js
 * @description 현재 클라이언트가 구동 중인 OS, 웹 브라우저 커널, 인앱 웹뷰(In-App WebView) 컨텍스트를 감지하여 런타임에 가장 적합한 네트워크 요청 스펙(AbortController) 및 브라우저 생명 주기(Page Lifecycle) 핸들러 세트를 동적으로 주입하고 관리하는 팩토리 컨텍스트 레이어 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {resolveStreamRuntimeType} from "@/platform/runtime/runtimeDetector";
import {STREAM_RUNTIME_TYPES} from "@/platform/runtime/runtimeTypes";
import {logPlatformDebug} from "@/platform/platformDebug";
import {createStreamRequestContext} from "@/api/sse/common/streamRequest";
import {createDesktopSseLifecycle} from "@/api/sse/browser/desktop/desktopLifecycle";
import {createChromeSseLifecycle} from "@/api/sse/browser/chrome/chromeLifecycle";
import {createAndroidWebViewSseLifecycle} from "@/api/sse/webview/android/androidWebViewLifecycle";

/**
 * @description 탐지된 스트림 런타임 상수 코드를 대조하여 각 플랫폼 엔진(안드로이드 웹뷰, 모바일 크롬, 일반 데스크톱)에 최적화된 독립형 SSE 라이프사이클 이벤트 리스너 제어기를 스위칭 및 생성합니다.
 * @param {string} runtimeType - `STREAM_RUNTIME_TYPES` 상수에 명시된 플랫폼 식별자 식별 키
 * @returns {object} 플랫폼 특화 백그라운드/이탈 핸들링 기능이 구현된 네이티브 라이프사이클 인스턴스
 */
function createLifecycle(runtimeType) {
  // 분기 1: 안드로이드 네이티브 앱 내부에서 하이브리드로 구동 중인 웹뷰 컨텍스트가 감지되었을 때의 격리 맵핑
  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW) {
    return createAndroidWebViewSseLifecycle();
  }

  // 분기 2: 모바일 안드로이드 크롬 브라우저 및 삼성 인터넷 등 모바일 웹 환경 전용 가드 맵핑
  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_CHROME) {
    return createChromeSseLifecycle();
  }

  // 폴백 분기: 상기 모바일 특수 환경 외의 윈도우, 맥OS, 리눅스 기반 표준 데스크톱 웹 환경 제어기 반환
  return createDesktopSseLifecycle();
}

/**
 * @typedef {object} SseRuntimeContextResult
 * @description 프론트엔드 채팅 전송 파이프라인(`runSseGenerationStream`) 직전 호출되어, 런타임 유형 분석부터 요청 제어용 Abort 파이프라인 빌드, 플랫폼별 라이프사이클 가드 장착까지의 부트스트랩 단계를 원스톱으로 빌드 및 패킹해 주는 통합 컨텍스트 팩토리 함수입니다.
 * @property {string} runtimeType - 동적으로 판별 완료된 현재 에이전트의 SSE 스트림 런타임 환경 식별 코드
 * @property {AbortController} controller - 현재 수립 중인 비동기 fetch 스트림 세션을 파괴할 수 있는 유선 연동용 AbortController
 * @property {object} lifecycle - 현재 실행 환경에 완벽히 튜닝되어 매핑 수립이 완료된 생명주기 관리 인터페이스 객체
 * @property {function(): void} cleanup - 네트워크 요청 객체 및 컨텍스트 리소스를 소멸시키기 위한 종결 클린업 실행 훅
 */
export function createSseRuntimeContext() {
  // 1. 디바이스의 UserAgent 및 플랫폼 네이티브 브릿지 유무를 추적하여 현재 하드웨어/소프트웨어 유형 판별
  const runtimeType = resolveStreamRuntimeType();

  // 2. 고유 요청 키(Request Key) 발급 및 단일 세션 보장을 위한 새 AbortController 오버레이 컨텍스트 개통
  const requestContext = createStreamRequestContext();

  // 3. 판정된 하드웨어 유형에 적합한 백그라운드 유실 방지 가드(Lifecycle) 매핑 조립
  const lifecycle = createLifecycle(runtimeType);

  // 플랫폼 진단 및 디버깅 가시성 확보를 위해 고유 가동 컨텍스트의 핵심 지표 스냅샷 로그 기록 수행
  logPlatformDebug("sse.context", {
    runtimeType, // 현재 가동 환경 코드
    requestKey: requestContext.requestKey, // 세션 고유 트래킹 ID
    overlay: requestContext.overlay, // 기존 세션 강제 차단 오버레이 가동 여부
    abort: Boolean(requestContext.controller), // 중단 컨트롤러 개통 정상 완수 여부
  });

  // 호출부(SSE 엔진 레이어)에서 직접 조작할 수 있도록 캡슐화된 핵심 제어 레버 패키지 리턴
  return {
    runtimeType,
    controller: requestContext.controller, // 네트워크 차단을 위한 컨트롤러 바이패스 전달
    lifecycle, // 백그라운드 버퍼 적체 처리를 위한 라이프사이클 전달
    cleanup: requestContext.cleanup, // 세션 수거용 파괴 클로저 리턴
  };
}
