import {shouldUseServerApi} from "@/constants/apiMode";
import {pickGenerationSample} from "@/api/mock/data/generationSamples.raw";
import {streamText} from "@/api/mock/fakeStream";
import {isGenerationAbortError} from "@/api/sse/common/sseErrors";
import {logPlatformDebug} from "@/platform/platformDebug";
import {runSseGenerationStream} from "@/api/sse/common/streamGenerationCore";
import {createSseRuntimeContext} from "@/api/sse/platforms/sseRuntimeContextFactory";

export {isGenerationAbortError};

function resolveRequestId(payload = {}) {
  return (
    payload?.requestId ||
    payload?.request_id ||
    payload?.msgId ||
    payload?.respMsgId ||
    ""
  );
}

async function streamGenerationMock(payload = {}, handlers = {}) {
  const {onChunk, onReasonChunk, onComplete} = handlers;

  const promptText = payload.body || payload.input || "";
  const text = pickGenerationSample(promptText);

  const requestId = resolveRequestId(payload);

  if (payload.isReasoning) {
    const reason = `질문을 분석하고 답변에 필요한 조건을 정리하고 있습니다.\n\n- 선택 모델: ${payload.modelId || ""}\n- 사용자 질문: ${promptText || ""}\n- 핵심 요청사항을 확인합니다.`;

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
