import {nextTick, ref} from "vue";
import {isGenerationAbortError, streamGeneration} from "@/api/sse/sse";
import {fetchGenerationResult} from "@/api/sse/generationResultApi";
import {logWarn} from "@/utils/logger";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {createId} from "@/utils/id";

function normalizePromptPayload(payload) {
  if (typeof payload === "string") {
    return {text: payload.trim(), attachments: []};
  }

  return {
    text: String(payload?.text || "").trim(),
    attachments: Array.isArray(payload?.attachments) ? payload.attachments : [],
  };
}

function createRequestPayload(base = {}) {
  const requestId = createId("request");
  return {
    request_id: requestId,
    requestId,
    ...base,
  };
}

function buildMockReasoningContent(normalized) {
  const target = normalized.text || "첨부 기반 요청";
  return `사용자 요청을 먼저 분해하고 답변에 필요한 항목을 정리했습니다.\n\n- 요청: ${target}\n- Assistant/Model payload를 생성했습니다.\n- 스트림 응답이 완료되기 전까지 메시지 액션은 숨김 처리됩니다.`;
}

function isDocumentHidden() {
  return typeof document !== "undefined" && document.hidden;
}

function canWrite(options) {
  if (typeof options.canWrite === "function") return options.canWrite();
  if (options.isReadOnly?.value) return false;
  if (options.isActiveModelUnavailable?.value) return false;
  return true;
}

async function resolveGenerationResultContent(requestId) {
  try {
    const result = await fetchGenerationResult(requestId);
    return result?.content || result?.answer || result?.data || "";
  } catch (error) {
    logWarn("[useChatSubmit] generation result sync failed:", error);
    return "";
  }
}

function createStreamScrollScheduler(options) {
  let pending = false;

  return () => {
    if (pending || isDocumentHidden()) return;

    pending = true;
    Promise.resolve()
      .then(async () => {
        pending = false;
        if (isDocumentHidden()) return;

        await nextTick();
        if (isDocumentHidden()) return;

        await options.scrollBottom({
          force: true,
          stable: true,
          autoAnswer: true,
        });
      })
      .catch((error) => {
        pending = false;
        logWarn("[useChatSubmit] stream scroll failed:", error);
      });
  };
}

function createAssistantMessageCommitter({
  chatId,
  initialMessages,
  initialAssistantMessage,
  messagesRef,
  setConversation,
}) {
  let liveMessages = initialMessages;
  let liveAssistantMessage = initialAssistantMessage;

  function commit(patch = {}) {
    liveAssistantMessage = {...liveAssistantMessage, ...patch};
    liveMessages = liveMessages.map((message) =>
      message.id === liveAssistantMessage.id ? liveAssistantMessage : message
    );
    messagesRef.value = liveMessages;
    setConversation(chatId, liveMessages);
  }

  return {
    commit,
    getAssistantMessage: () => liveAssistantMessage,
    getMessages: () => liveMessages,
  };
}

async function commitFirstAnswerChunk({content, getAssistantMessage, commit}) {
  if (getAssistantMessage().reasoningStatus === "thinking") {
    commit({reasoningStatus: "completed"});
    await nextTick();
  }

  commit({content, status: "streaming"});
}

async function scrollAfterUserSubmit(options) {
  await nextTick();

  if (options.autoScrollOnAnswer?.value) {
    await options.scrollBottom({force: true, stable: true, autoAnswer: true});
    return;
  }

  await options.scrollLatestUserMessage?.({
    behavior: "auto",
    stable: true,
    offset: 16,
  });
}

function createGenerationPayload(options, normalized, chatId) {
  return createRequestPayload({
    assistantId: options.selectedAssistantId?.value || "",
    modelId: options.selectedModel?.value || "",
    input: normalized.text,
    chatId,
  });
}


async function createConversationForSubmit(options, normalized) {
  const context = {
    assistantId: options.selectedAssistantId?.value || "",
    modelId: options.selectedModel?.value || "",
  };

  if (typeof options.createConversation === "function") {
    return options.createConversation(normalized, context);
  }

  try {
    return await options.createRemoteConversation({
      text: normalized.text,
      assistantId: context.assistantId,
      modelId: context.modelId,
    });
  } catch (error) {
    logWarn(
      "[useChatSubmit] new.do 호출 실패, local conversation으로 대체:",
      error
    );
    return options.createLocalConversation(normalized);
  }
}

async function runAssistantStream({
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

export function useChatSubmit(options) {
  const isGenerating = ref(false);
  const chatStreamStore = useChatStreamStore();

  async function submitPrompt(payload) {
    const normalized = normalizePromptPayload(payload);
    if (
      !canWrite(options) ||
      (!normalized.text && normalized.attachments.length === 0) ||
      isGenerating.value
    ) {
      return;
    }

    let targetHistoryId = String(options.route.params.id || "");

    if (
      options.route.name === "main" ||
      options.route.name === "chat-entry" ||
      !targetHistoryId
    ) {
      const history = await createConversationForSubmit(options, normalized);
      targetHistoryId = history.id;

      await options.router
        .push({name: "chat", params: {id: targetHistoryId}})
        .catch(() => {});
      await nextTick();
    }

    const {messages, assistantMessage} = options.appendUserAndAssistantMessages(
      targetHistoryId,
      normalized
    );
    options.syncHistories?.();

    const committer = createAssistantMessageCommitter({
      chatId: targetHistoryId,
      initialMessages: messages,
      initialAssistantMessage: {
        ...assistantMessage,
        status: "streaming",
        reasoningContent: buildMockReasoningContent(normalized),
        reasoningStatus: "thinking",
      },
      messagesRef: options.messages,
      setConversation: options.setConversation,
    });
    const scheduleStreamScroll = createStreamScrollScheduler(options);

    committer.commit();
    await scrollAfterUserSubmit(options);

    isGenerating.value = true;
    chatStreamStore.start();

    try {
      await runAssistantStream({
        options,
        normalized,
        chatId: targetHistoryId,
        commit: committer.commit,
        getAssistantMessage: committer.getAssistantMessage,
        scheduleStreamScroll,
        abortFallbackMessage: "(응답 생성이 중단되었습니다.)",
        errorFallbackMessage: "(응답 생성 중 오류가 발생했습니다.)",
        logPrefix: "[useChatSubmit]",
      });
    } finally {
      isGenerating.value = false;
      chatStreamStore.finish();
    }
  }

  async function regenerateResponse(message = {}) {
    if (!canWrite(options) || isGenerating.value) return;

    const targetHistoryId = String(options.route.params.id || "");
    if (!targetHistoryId) return;

    const currentMessages = Array.isArray(options.messages.value)
      ? options.messages.value
      : [];
    const assistantIndex = currentMessages.findIndex(
      (item) => item.id === message.id
    );
    if (assistantIndex <= 0) return;

    const userMessage = [...currentMessages]
      .slice(0, assistantIndex)
      .reverse()
      .find((item) => item.role === "user");
    if (!userMessage) return;

    const normalized = normalizePromptPayload({
      text: userMessage.content,
      attachments: userMessage.attachments || [],
    });
    const assistantMessage = {
      id: createId("message"),
      role: "assistant",
      content: "",
      reasoningContent: buildMockReasoningContent(normalized),
      reasoningStatus: "thinking",
      status: "streaming",
      createdAt: new Date().toISOString(),
    };
    const committer = createAssistantMessageCommitter({
      chatId: targetHistoryId,
      initialMessages: [
        ...currentMessages.slice(0, assistantIndex),
        assistantMessage,
      ],
      initialAssistantMessage: assistantMessage,
      messagesRef: options.messages,
      setConversation: options.setConversation,
    });
    const scheduleStreamScroll = createStreamScrollScheduler(options);

    committer.commit();
    await nextTick();
    await options.scrollBottom({force: true, stable: true, autoAnswer: true});

    isGenerating.value = true;
    chatStreamStore.start();

    try {
      await runAssistantStream({
        options,
        normalized,
        chatId: targetHistoryId,
        commit: committer.commit,
        getAssistantMessage: committer.getAssistantMessage,
        scheduleStreamScroll,
        abortFallbackMessage: "(응답 재생성이 중단되었습니다.)",
        errorFallbackMessage: "(응답 재생성 중 오류가 발생했습니다.)",
        logPrefix: "[useChatSubmit] 재생성",
      });
    } finally {
      isGenerating.value = false;
      chatStreamStore.finish();
    }
  }

  return {
    isGenerating,
    submit: submitPrompt,
    regenerate: regenerateResponse,
  };
}
