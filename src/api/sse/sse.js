/**
 * @file api/sse/sse.js
 * @description SSE 스트리밍 계층입니다. fetch ReadableStream, data: frame 파싱, chunk commit, 모바일 lifecycle abort를 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {shouldUseServerApi} from "@/constants/apiMode";
import {pickGenerationSample} from "@/api/mock/data/generationSamples.raw";
import {streamText} from "@/api/mock/fakeStream";
import {isGenerationAbortError} from "@/api/sse/common/sseErrors";
import {logPlatformDebug} from "@/platform/platformDebug";
import {runSseGenerationStream} from "@/api/sse/common/streamGenerationCore";
import {createSseRuntimeContext} from "@/api/sse/platforms/streamRuntimeContext";

export {isGenerationAbortError};

/**
 * @description 페이로드 객체 내부에 서버 스펙별로 다르게 혼재되어 인입될 수 있는 카멜 케이스(requestId) 및 스네이크 케이스(request_id) 형태의 고유 요청 식별자를 안전하게 추출합니다.
 * @param {object} [payload={}] - 요청 패킷 페이로드 객체
 * @returns {string} 추출 완료된 세션 고유 ID 문자열 (부재 시 빈 문자열 반환)
 */
function resolveRequestId(payload = {}) {
  return payload?.requestId || payload?.request_id || "";
}

/**
 * @description [개발/테스트 전용] 서버 API 모드가 꺼져 있을 때 작동하며, 로컬 환경에서 지연 시간(Delay) 타이머 루프를 통해 마치 실제 백엔드 LLM이 추론하고 글자를 타이핑하여 내려주는 듯한 가상 스트리밍 효과를 에뮬레이션합니다.
 * @param {object} [payload={}] - 가상 생성에 필요한 입력 키워드 및 모델 정보 페이로드
 * @param {object} [handlers={}] - 비동기 데이터 전달용 UI 핸들러 모음집
 * @param {function(string): void} [handlers.onChunk] - 일반 답변 청크 인입 시의 UI 콜백
 * @param {function(string): void} [handlers.onReasonChunk] - 생각 프로세스(추론) 청크 인입 시의 UI 콜백
 * @param {function(object): void} [handlers.onComplete] - 스트리밍 시뮬레이션 완수 시의 종료 콜백
 * @returns {Promise<object>} 가상 스트리밍이 완수된 최종 상태 데이터 구조체
 */
async function streamGenerationMock(payload = {}, handlers = {}) {
  const {onChunk, onReasonChunk, onComplete} = handlers;

  // 사용자 질문 텍스트 원문을 기반으로 가짜 답변 샘플 풀(Pool)에서 알맞은 결과 텍스트 매칭 추출
  const text = pickGenerationSample(payload.input);
  // 추적 로그 연동을 위한 ID 포인터 수립
  const requestId = resolveRequestId(payload);

  // DeepSeek 등의 추론 기능을 모방하기 위해 패킷 상에 추론 플래그(isReasoning)가 활성화되어 있는 경우, 사전에 준비된 추론 템플릿 텍스트를 먼저 타이핑 에뮬레이션 가동
  if (payload.isReasoning) {
    const reason = `질문을 분석하고 답변에 필요한 조건을 정리하고 있습니다.\n\n- 선택 모델: ${payload.modelId || ""}\n- 사용자 질문: ${payload.input || ""}\n- 핵심 요청사항을 확인합니다.`;
    // 18ms 인터벌 지연 주기를 두고 글자 파편을 UI 단의 'onReasonChunk'로 비동기 방출
    await streamText(reason, (chunk) => onReasonChunk?.(chunk), {delay: 18});
  }

  // 본문 가짜 답변 텍스트를 마찬가지로 18ms 인터벌 단위로 UI 단의 'onChunk' 채널에 디스패치
  await streamText(text, (chunk) => onChunk?.(chunk), {delay: 18});
  // 스트리밍 타이핑 시뮬레이션 종료 콜백 단행
  await onComplete?.({requestId});

  // 코어 스트림 엔진 반환 규격과 1:1 대칭을 이루는 모크 전용 완수 오브젝트 리턴
  return {
    completed: true,
    requestId,
    accumulated: text,
    reasonAccumulated: payload.isReasoning ? "mock reasoning" : "",
    runtimeType: "mock",
  };
}

/**
 * @description [전역 스트림 엔트리포인트] 시스템 설정 및 네이티브 에이전트 환경 분석을 바탕으로, 모크 시뮬레이터 혹은 최적화된 플랫폼별(데스크톱/모바일 크롬/안드로이드 웹뷰) 실제 SSE 네트워크 파이프라인으로 트래픽을 중계 및 분기하는 최상위 인터페이스 함수입니다.
 * @param {object} [payload={}] - 백엔드 LLM 엔진으로 송신할 프롬프트 및 파라미터 구조체 원품
 * @param {object} [handlers={}] - 실시간 렌더링에 필요한 스트림 콜백 핸들러 세트
 * @returns {Promise<object>} 생성 성공 여부 및 최종 누적 문자열을 담은 생성 라이프사이클 최종 결과 객체
 */
export async function streamGeneration(payload = {}, handlers = {}) {
  // 분기 가드: 로컬 개발 환경용 상수가 활성화되어 있거나 오프라인 가동 모드인 경우 서버 통신을 차단하고 즉시 로컬 모크 시뮬레이터로 라우팅 유도
  if (!shouldUseServerApi()) return streamGenerationMock(payload, handlers);

  // 1. 현재 접속 환경(OS, 크롬, 인앱 웹뷰 등)을 자동 파싱하여 플랫폼 특화 AbortController 및 생명주기가 탑재된 최신 컨텍스트 수립
  const context = createSseRuntimeContext();

  // 하드웨어 추적 및 크래시 리포트를 위해 수립 완료된 라우팅 타깃 플랫폼 정보를 디버그 콘솔에 기록
  logPlatformDebug("sse.route", {runtimeType: context.runtimeType});

  try {
    // 2. 통합 검증 완료된 컨텍스트를 주입하여 실제 fetch + ReadableStream 기반의 Core 비동기 루프 엔진을 점화 실행
    return await runSseGenerationStream({
      payload,
      handlers,
      controller: context.controller, // 세션 차단용 시그널 전달
      lifecycle: context.lifecycle, // 모바일 전용 버퍼 적체/안내 팝업 가드 인터페이스 전달
      runtimeType: context.runtimeType,
    });
  } finally {
    // 3. 스트림이 정상 종료되거나 중간에 에러(Abort 포함)가 발생하여 중도 파괴되더라도, 메모리 누수 방지를 위해 단일 세션용 오버레이 리소스를 가비지 컬렉션(GC) 대상으로 강제 방전 탈거
    context.cleanup?.();
  }
}
