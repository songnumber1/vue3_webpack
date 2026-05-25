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
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveRequestId(payload = {}) {
  return payload?.requestId || payload?.request_id || "";
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
async function streamGenerationMock(payload = {}, handlers = {}) {
  const {onChunk, onReasonChunk, onComplete} = handlers;
  const text = pickGenerationSample(payload.input);
  const requestId = resolveRequestId(payload);

  if (payload.isReasoning) {
    const reason = `질문을 분석하고 답변에 필요한 조건을 정리하고 있습니다.\n\n- 선택 모델: ${payload.modelId || ""}\n- 사용자 질문: ${payload.input || ""}\n- 핵심 요청사항을 확인합니다.`;
    await streamText(reason, (chunk) => onReasonChunk?.(chunk), {delay: 18});
  }
  await streamText(text, (chunk) => onChunk?.(chunk), {delay: 18});
  await onComplete?.({requestId});

  return {
    completed: true,
    requestId,
    accumulated: text,
    reasonAccumulated: payload.isReasoning ? "mock reasoning" : "",
    runtimeType: "mock",
  };
}

export async function streamGeneration(payload = {}, handlers = {}) {
  if (!shouldUseServerApi()) return streamGenerationMock(payload, handlers);

  const context = createSseRuntimeContext();

  logPlatformDebug("sse.route", {runtimeType: context.runtimeType});

  try {
    return await runSseGenerationStream({
      payload,
      handlers,
      controller: context.controller,
      lifecycle: context.lifecycle,
      runtimeType: context.runtimeType,
    });
  } finally {
    context.cleanup?.();
  }
}
