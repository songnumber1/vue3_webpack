import {nextTick} from "vue";
import {isGenerationAbortError, streamGeneration} from "@/api/sse/sse";
import {fetchGenerationResult} from "@/api/sse/common/streamRequest";
import {logWarn} from "@/utils/logger";
import {createGenerationPayload} from "./chatSubmitPayload";
import {commitFirstAnswerChunk} from "./streamingMessageCommitter";
import {adaptGenerationResultContent} from "@/adapters/generationResponseAdapter";

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
    const fallbackContent =
      syncedContent ||
      error.accumulated ||
      getAssistantMessage().content ||
      (isAbort ? abortFallbackMessage : errorFallbackMessage);

    const shouldShowErrorArea = !isAbort && !syncedContent;

    commit({
      status: shouldShowErrorArea
        ? "error"
        : fallbackContent
          ? "complete"
          : "error",
      error: shouldShowErrorArea,
      errorTitle: shouldShowErrorArea ? "답변 생성 실패" : "",
      errorMessage: shouldShowErrorArea ? fallbackContent : "",
      isReasoning:
        getAssistantMessage().isReasoning || Boolean(error.reasonAccumulated),
      reasoningContent:
        error.reasonAccumulated || getAssistantMessage().reasoningContent || "",
      reasoningStatus: "completed",
      content: fallbackContent,
    });
  }
}
