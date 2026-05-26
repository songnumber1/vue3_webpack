import {applyGenerationStreamData} from "@/api/sse/common/generationStreamParser";
import {SSE} from "@/api/sse/vendor/sse";
import {createChunkCommitter} from "@/api/sse/common/chunkCommitter";
import {createAbortError} from "@/api/sse/common/sseErrors";
import {resolveGenerationUrl, resolveSseAuthOptions} from "@/api/sse/common/streamRequest";
import {refreshAccessTokenOnce} from "@/auth/refreshTokenService";

function isUnauthorizedStreamError(error) {
  const status = Number(error?.status || error?.responseCode || error?.code || 0);
  return status === 401;
}

export async function runSseGenerationStream({
  payload,
  handlers,
  controller,
  lifecycle,
  runtimeType = "unknown",
}) {
  const {onChunk, onReasonChunk, onComplete} = handlers || {};

  const committer = createChunkCommitter(onChunk);
  const reasonCommitter = createChunkCommitter(onReasonChunk);
  let source = null;
  let accumulated = "";
  let reasonAccumulated = "";
  let completed = false;
  let settled = false;

  const cleanupLifecycle = lifecycle?.install?.({
    controller,
    flush: () =>
      Promise.all([
        committer.flush(accumulated),
        reasonCommitter.flush(reasonAccumulated),
      ]),
  });

  const requestId =
    payload?.requestId || payload?.request_id || payload?.msgId || "";

  const closeSource = () => {
    if (!source) return;
    source.close();
  };

  const abortListener = () => closeSource();
  controller?.signal?.addEventListener?.("abort", abortListener, {once: true});

  const executeStream = async (authOptions) => {
    completed = false;
    settled = false;

    await new Promise((resolve, reject) => {
      const finishResolve = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const finishReject = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      source = new SSE(resolveGenerationUrl(), {
        start: false,
        method: "POST",
        withCredentials: authOptions.withCredentials,
        autoReconnect: false,
        headers: {
          ...authOptions.headers,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        payload: JSON.stringify(payload || {}),
      });

      source.addEventListener("message", (event) => {
        try {
          if (controller?.signal?.aborted) {
            throw controller.signal.reason || createAbortError("Aborted");
          }

          const nextState = applyGenerationStreamData({
            raw: event.data,
            accumulated,
            reasonAccumulated,
          });
          accumulated = nextState.accumulated;
          reasonAccumulated = nextState.reasonAccumulated;

          if (nextState.reasonChanged) {
            reasonCommitter.update(reasonAccumulated);
          }
          if (nextState.changed) {
            lifecycle?.onAccumulated?.({accumulated, committer});
          }
          if (nextState.done) {
            completed = true;
            finishResolve();
            closeSource();
          }
        } catch (error) {
          closeSource();
          finishReject(error);
        }
      });

      source.addEventListener("error", (event) => {
        const error = new Error(
          event?.message || event?.data || "generation stream failed"
        );
        const status = event?.status || event?.responseCode;
        if (status) error.status = status;
        finishReject(error);
      });

      source.addEventListener("abort", () => {
        if (controller?.signal?.aborted) {
          finishReject(controller.signal.reason || createAbortError("Aborted"));
          return;
        }
        if (!completed)
          finishReject(createAbortError("generation stream aborted"));
      });

      source.addEventListener("readystatechange", () => {
        if (
          source?.readyState === SSE.CLOSED &&
          !completed &&
          !controller?.signal?.aborted
        ) {
          finishResolve();
        }
      });

      source.stream();
    });
  };

  try {
    let authOptions = await resolveSseAuthOptions();

    try {
      await executeStream(authOptions);
    } catch (error) {
      if (
        authOptions.policy.isJwt &&
        isUnauthorizedStreamError(error) &&
        !controller?.signal?.aborted
      ) {
        const accessToken = await refreshAccessTokenOnce();
        authOptions = {
          ...authOptions,
          headers: {
            ...authOptions.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        };
        closeSource();
        await executeStream(authOptions);
      } else {
        throw error;
      }
    }

    await reasonCommitter.flush(reasonAccumulated);
    await committer.flush(accumulated);
    await onComplete?.({requestId});

    return {
      completed: true,
      requestId,
      accumulated,
      reasonAccumulated,
      runtimeType,
    };
  } catch (error) {
    await reasonCommitter.flush(reasonAccumulated);
    await committer.flush(accumulated);
    error.accumulated = accumulated;
    error.reasonAccumulated = reasonAccumulated;
    error.generationRequestId = requestId;
    throw error;
  } finally {
    controller?.signal?.removeEventListener?.("abort", abortListener);
    cleanupLifecycle?.();
    closeSource();
  }
}
