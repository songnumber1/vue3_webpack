import {nextTick} from "vue";
import {isGenerationAbortError, streamGeneration} from "@/api/sse/sse";
import {fetchGenerationResult} from "@/api/sse/common/streamRequest";
import {logWarn} from "@/utils/logger";
import {createGenerationPayload} from "./chatSubmitPayload";
import {commitFirstAnswerChunk} from "./streamingMessageCommitter";
import {adaptGenerationResultContent} from "@/adapters/generationResponseAdapter";

function resolveStreamErrorTitle(error) {
  if (error?.doneMissing) return "답변 생성이 완료되지 않았습니다";
  return "답변 생성 실패";
}

function resolveStreamErrorMessage({error, fallbackMessage}) {
  const message = String(error?.message || "").trim();
  if (error?.doneMissing) {
    return "서버 응답이 완료 신호 없이 종료되었습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (error?.streamError && message) return message;
  if (
    message &&
    !/generation stream failed|generation stream returned error/i.test(message)
  ) {
    return message;
  }

  return fallbackMessage || "응답 생성 중 오류가 발생했습니다.";
}

function resolveStreamErrorCode(error) {
  if (error?.doneMissing) return "SSE_DONE_MISSING";
  return error?.streamErrorCode || "SSE_STREAM_ERROR";
}

async function resolveGenerationResultContent(requestId) {
  try {
    const result = await fetchGenerationResult(requestId);
    return adaptGenerationResultContent(result);
  } catch (error) {
    logWarn("[useChatSubmit] generation result sync failed:", error);
    return "";
  }
}

export async function runAssistantStream({
  options,
  normalized,
  chatId,
  commit,
  getAssistantMessage,
  scheduleStreamScroll,
  abortFallbackMessage,
  errorFallbackMessage,
  logPrefix,
}) {
  try {
    await streamGeneration(
      createGenerationPayload(options, normalized, chatId),
      {
        onReasonChunk: async (reasoningContent) => {
          commit({
            isReasoning: true,
            reasoningContent,
            reasoningStatus: "thinking",
          });
          scheduleStreamScroll();
        },
        onChunk: async (content) => {
          await commitFirstAnswerChunk({content, getAssistantMessage, commit});
          scheduleStreamScroll();
        },
        onComplete: () => {
          commit({status: "complete", reasoningStatus: "completed"});
        },
      }
    );

    commit({status: "complete", reasoningStatus: "completed"});
    await nextTick();
    await options.renderAfterStream();
  } catch (error) {
    const isAbort = isGenerationAbortError(error);
    logWarn(
      `${logPrefix} ${isAbort ? "스트리밍이 중단되었습니다" : "스트리밍 오류"}:`,
      error
    );

    const syncedContent = await resolveGenerationResultContent(
      error.generationRequestId
    );

    if (!isAbort && !syncedContent) {
      commit({
        status: "error",
        error: true,
        errorTitle: resolveStreamErrorTitle(error),
        errorMessage: resolveStreamErrorMessage({
          error,
          fallbackMessage: errorFallbackMessage,
        }),
        errorCode: resolveStreamErrorCode(error),
        isReasoning:
          getAssistantMessage().isReasoning || Boolean(error.reasonAccumulated),
        reasoningContent:
          error.reasonAccumulated ||
          getAssistantMessage().reasoningContent ||
          "",
        reasoningStatus: "completed",
        content: "",
      });
      return;
    }

    const fallbackContent =
      syncedContent ||
      error.accumulated ||
      getAssistantMessage().content ||
      (isAbort ? abortFallbackMessage : errorFallbackMessage);

    commit({
      status: fallbackContent ? "complete" : "error",
      error: false,
      errorTitle: "",
      errorMessage: "",
      errorCode: "",
      isReasoning:
        getAssistantMessage().isReasoning || Boolean(error.reasonAccumulated),
      reasoningContent:
        error.reasonAccumulated || getAssistantMessage().reasoningContent || "",
      reasoningStatus: "completed",
      content: fallbackContent,
    });
  }
}
