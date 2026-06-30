import {shouldUseServerApi} from "@/constants/apiMode";
import {pickGenerationSample} from "@/api/mock/data/generationSamples.raw";
import {streamText} from "@/api/mock/fakeStream";
import {isGenerationAbortError} from "@/api/sse/common/sseErrors";
import {logPlatformDebug} from "@/platform/platformDebug";
import {runSseGenerationStream} from "@/api/sse/common/streamGenerationCore";
import {createSseRuntimeContext} from "@/api/sse/platforms/sseRuntimeContextFactory";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";

function readFirstString(...values) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim()
  );
  return found ? found.trim() : "";
}

function resolveGenerationRequestId(payload = {}) {
  return readFirstString(
    payload?.[G.REQUEST_ID],
    payload?.[G.REQUEST_ID_SNAKE],
    payload?.[G.MESSAGE_ID],
    payload?.[G.RESPONSE_MESSAGE_ID]
  );
}

function resolveGenerationPromptText(payload = {}) {
  return readFirstString(payload?.[G.BODY], payload?.[G.INPUT]);
}

export {isGenerationAbortError};

async function streamGenerationMock(payload = {}, handlers = {}) {
  const {onChunk, onComplete} = handlers;

  const promptText = resolveGenerationPromptText(payload);
  const text = pickGenerationSample(promptText);

  const requestId = resolveGenerationRequestId(payload);

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
    return await runSseGenerationStream(
      payload,
      handlers,
      context.controller,
      context.lifecycle,
      context.runtimeType
    );
  } finally {
    context.cleanup?.();
  }
}
