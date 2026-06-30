import {nextTick} from "vue";
import {isGenerationAbortError, streamGeneration} from "@/api/sse/sse";
import {fetchGenerationResult} from "@/api/sse/common/streamRequest";
import {logWarn} from "@/utils/logger";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {createId} from "@/utils/id";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {API_RESPONSE_KEYS as R} from "@/constants/api/apiResponseKeys";
import {unwrapApiBody} from "@/utils/apiResponseReader";
import {normalizeChatId} from "@/utils/normalize";


async function commitFirstAnswerChunk(content, getAssistantMessage, commit) {
  if (getAssistantMessage().reasoningStatus === "thinking") {
    commit({reasoningStatus: "completed", content});
    await nextTick();
    return;
  }

  commit({content});
}

function createRequestPayload(base = {}) {
  const msgId = createId("message");
  const respMsgId = createId("message");
  return {
    [G.MESSAGE_ID]: msgId,
    [G.RESPONSE_MESSAGE_ID]: respMsgId,
    ...base,
  };
}

function resolvePromptToolSettings() {
  const promptControlStore = usePromptControlStore();
  return promptControlStore.activePromptToolSettings || {};
}

function resolveStyleOptions(settings = {}) {
  const values = [];

  Object.values(settings.promptTemplateOptions || {}).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) values.push(String(item));
      });
      return;
    }

    if (value) values.push(String(value));
  });

  return values;
}

function createGenerationPayload(
  normalized,
  chatId,
  selectedAssistantId,
  selectedModel
) {
  const resolvedChatId = normalizeChatId(chatId);

  if (!resolvedChatId) {
    throw new Error(
      "generation.do payload requires chatId from new.do or current route."
    );
  }

  const settings = resolvePromptToolSettings();
  const knowledgeSearch = Array.isArray(settings.knowledgeSearch)
    ? settings.knowledgeSearch.filter(Boolean)
    : [];

  return createRequestPayload({
    [G.CHAT_ID]: resolvedChatId,
    [G.ASSIST_ID]: selectedAssistantId || "",
    [G.MODEL_ID]: selectedModel || "",
    [G.STUDIO]: false,
    [G.INTENTION]: "직접입력",
    [G.RAG]: knowledgeSearch.length > 0,
    [G.RAG_COT]: false,
    [G.IMAGE_S3_PATH_LEGACY]: null,
    [G.SOURCE_TYPE]: "internal",
    [G.ARRAY_OPTIONS]: knowledgeSearch,
    [G.MESSAGE_FILE_HISTORY]: null,
    [G.STYLES]: resolveStyleOptions(settings),
    [G.BODY]: normalized.text,
    [G.BYTE_SIZE]: 10000,
    [G.LAST_FEDERATION_INFO]: null,
    [G.UI_STATE_INFO_WRAPPER]: null,
  });
}


function resolveStreamErrorTitle(error) {
  if (error?.doneMissing) return "답변 생성이 완료되지 않았습니다";
  return "답변 생성 실패";
}

function resolveStreamErrorMessage(error, fallbackMessage) {
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

function readFirstString(...values) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim()
  );
  return found ? found.trim() : "";
}

function adaptGenerationResultContent(response) {
  const body = unwrapApiBody(response, response) || {};
  return readFirstString(
    body?.[G.CONTENT],
    body?.[G.ANSWER],
    body?.[R.DATA],
    response?.[G.CONTENT],
    response?.[G.ANSWER],
    response?.[R.DATA]
  );
}

async function resolveGenerationResultContent(requestId) {
  try {
    const result = await fetchGenerationResult(requestId);
    return adaptGenerationResultContent(result);
  } catch (error) {
    logWarn("[chatStreamActions] generation result sync failed:", error);
    return "";
  }
}

function commitStreamError(
  error,
  commit,
  getAssistantMessage,
  errorFallbackMessage
) {
  commit({
    status: "error",
    error: true,
    errorTitle: resolveStreamErrorTitle(error),
    errorMessage: resolveStreamErrorMessage(error, errorFallbackMessage),
    errorCode: resolveStreamErrorCode(error),
    isReasoning: getAssistantMessage().isReasoning,
    reasoningContent: getAssistantMessage().reasoningContent || "",
    reasoningStatus: "completed",
    content: "",
  });
}

function commitStreamFallback(
  error,
  syncedContent,
  isAbort,
  commit,
  getAssistantMessage,
  abortFallbackMessage,
  errorFallbackMessage
) {
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
    isReasoning: getAssistantMessage().isReasoning,
    reasoningContent: getAssistantMessage().reasoningContent || "",
    reasoningStatus: "completed",
    content: fallbackContent,
  });
}

export async function runAssistantStream(
  normalized,
  chatId,
  selectedAssistantId,
  selectedModel,
  renderAfterStream,
  commit,
  getAssistantMessage,
  scheduleStreamScroll,
  abortFallbackMessage,
  errorFallbackMessage,
  logPrefix = "[chatStreamActions]"
) {
  try {
    await streamGeneration(
      createGenerationPayload(
        normalized,
        chatId,
        selectedAssistantId,
        selectedModel
      ),
      {
        onChunk: async (content) => {
          await commitFirstAnswerChunk(content, getAssistantMessage, commit);
          scheduleStreamScroll();
        },
        onComplete: () => {
          commit({status: "complete", reasoningStatus: "completed"});
        },
      }
    );

    commit({status: "complete", reasoningStatus: "completed"});
    await nextTick();
    if (typeof renderAfterStream === "function") {
      await renderAfterStream();
    }
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
      commitStreamError(
        error,
        commit,
        getAssistantMessage,
        errorFallbackMessage
      );
      return;
    }

    commitStreamFallback(
      error,
      syncedContent,
      isAbort,
      commit,
      getAssistantMessage,
      abortFallbackMessage,
      errorFallbackMessage
    );
  }
}
