import {nextTick} from "vue";
import {isGenerationAbortError, streamGeneration} from "@/api/sse/sse";
import {fetchGenerationResult} from "@/api/sse/common/streamRequest";
import {logWarn} from "@/utils/logger";
import {createGenerationPayload} from "./chatSubmitPayload";
import {commitFirstAnswerChunk} from "./chatSubmitCommitter";

async function resolveGenerationResultContent(requestId) {
  try {
    const result = await fetchGenerationResult(requestId);
    return result?.content || result?.answer || result?.data || "";
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
    await streamGeneration(createGenerationPayload(options, normalized, chatId), {
      onReasonChunk: async (reasoningContent) => {
        commit({reasoningContent, reasoningStatus: "thinking"});
        scheduleStreamScroll();
      },
      onChunk: async (content) => {
        await commitFirstAnswerChunk({content, getAssistantMessage, commit});
        scheduleStreamScroll();
      },
      onComplete: () => {
        commit({status: "complete", reasoningStatus: "completed"});
      },
    });

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

    commit({
      status: fallbackContent ? "complete" : "error",
      reasoningStatus: "completed",
      content: fallbackContent,
    });
  }
}
