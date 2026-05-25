import {shouldUseServerApi} from "@/constants/apiMode";
import {pickGenerationSample} from "@/api/mock/data/generationSamples.raw";
import {streamText} from "@/api/mock/fakeStream";
import {isGenerationAbortError} from "@/api/sse/common/sseErrors";
import {logPlatformDebug} from "@/platform/platformDebug";
import {runSseGenerationStream} from "@/api/sse/common/streamGenerationCore";
import {createSseRuntimeContext} from "@/api/sse/platforms/streamRuntimeContext";

export {isGenerationAbortError};

function resolveRequestId(payload = {}) {
  return payload?.requestId || payload?.request_id || "";
}

async function streamGenerationMock(payload = {}, handlers = {}) {
  const {onChunk, onComplete} = handlers;
  const text = pickGenerationSample(payload.input);
  const requestId = resolveRequestId(payload);

  await streamText(text, (chunk) => onChunk?.(chunk), {delay: 18});
  await onComplete?.({requestId});

  return {
    completed: true,
    requestId,
    accumulated: text,
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
