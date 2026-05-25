import {parseSseBuffer} from "@/api/sse/sseParser";
import {appendParsedEvents} from "@/api/sse/common/sseFrame";
import {createChunkCommitter} from "@/api/sse/common/chunkCommitter";
import {createAbortError, isGenerationAbortError} from "@/api/sse/common/sseErrors";
import {resolveGenerationUrl} from "@/api/sse/common/streamRequest";
import {logWarn} from "@/utils/logger";

export async function runSseGenerationStream({
  payload,
  handlers,
  controller,
  lifecycle,
  runtimeType = "unknown",
}) {
  const {onChunk, onComplete} = handlers || {};
  const committer = createChunkCommitter(onChunk);
  let reader = null;
  let accumulated = "";

  const cleanupLifecycle = lifecycle?.install?.({
    controller,
    getReader: () => reader,
    getAccumulated: () => accumulated,
    flush: () => committer.flush(accumulated),
  });

  try {
    const response = await fetch(resolveGenerationUrl(), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });

    if (!response.ok) {
      throw new Error(`generation stream failed: ${response.status}`);
    }
    if (!response.body) {
      throw new Error("generation stream body is empty");
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let done = false;

    while (!done) {
      if (controller?.signal?.aborted) {
        throw controller.signal.reason || createAbortError("Aborted");
      }

      const result = await reader.read();
      done = result.done;

      if (result.value) {
        buffer += decoder.decode(result.value, {stream: true});
      }

      if (done) {
        buffer += decoder.decode();
      }

      const parsed = parseSseBuffer(buffer);
      buffer = parsed.rest;

      const nextState = appendParsedEvents(parsed.events, accumulated);
      accumulated = nextState.accumulated;

      if (nextState.done) done = true;
      if (nextState.changed) {
        lifecycle?.onAccumulated?.({accumulated, committer});
      }
    }

    await committer.flush(accumulated);
    await onComplete?.({requestId: payload?.requestId || payload?.request_id || ""});

    return {
      completed: true,
      requestId: payload?.requestId || payload?.request_id || "",
      accumulated,
      runtimeType,
    };
  } catch (error) {
    await committer.flush(accumulated);
    error.accumulated = accumulated;
    error.generationRequestId = payload?.requestId || payload?.request_id || "";
    throw error;
  } finally {
    cleanupLifecycle?.();

    if (reader && controller?.signal?.aborted) {
      await reader.cancel(controller.signal.reason).catch((error) => {
        if (!isGenerationAbortError(error)) {
          logWarn("[streamGeneration] reader cleanup failed:", error);
        }
      });
    }
  }
}
