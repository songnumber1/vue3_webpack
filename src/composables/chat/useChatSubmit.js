import {nextTick, ref} from "vue";
import {isGenerationAbortError, streamGeneration} from "@/api/sse/sse";
import {fetchGenerationResult} from "@/api/sse/generationResultApi";
import {logWarn} from "@/utils/logger";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {createId} from "@/utils/id";

function normalizePromptPayload(payload) {
  if (typeof payload === "string")
    return {text: payload.trim(), attachments: []};
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

/**
 * stream 중에는 content 반영과 scroll/nextTick을 분리합니다.
 *
 * content는 background 상태에서도 즉시 반영되어야 하므로 동기적으로 commit하고,
 * scroll은 foreground에서만 한 번씩 예약합니다. 이렇게 해야 모바일 Chrome에서
 * background OFF 상태로 수신한 데이터도 화면 복귀 시 최신 content로 표시됩니다.
 */

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

export function useChatSubmit(options) {
  const isGenerating = ref(false);
  const chatStreamStore = useChatStreamStore();

  async function handleSubmit(payload) {
    const normalized = normalizePromptPayload(payload);
    if (
      (!normalized.text && normalized.attachments.length === 0) ||
      isGenerating.value
    )
      return;

    let targetHistoryId = String(options.route.params.id || "");
    if (
      options.route.name === "main" ||
      options.route.name === "chat-entry" ||
      !targetHistoryId
    ) {
      const assistantId = options.selectedAssistantId?.value || "";
      const modelId = options.selectedModel?.value || "";
      const history = await options.createConversation(normalized, {
        assistantId,
        modelId,
      });
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
    let liveMessages = messages;
    let liveAssistantMessage = {
      ...assistantMessage,
      status: "streaming",
      reasoningContent: buildMockReasoningContent(normalized),
      reasoningStatus: "thinking",
    };
    const scheduleStreamScroll = createStreamScrollScheduler(options);

    function commitAssistantMessage(patch = {}) {
      liveAssistantMessage = {...liveAssistantMessage, ...patch};
      liveMessages = liveMessages.map((message) =>
        message.id === liveAssistantMessage.id ? liveAssistantMessage : message
      );
      options.messages.value = liveMessages;
      options.setConversation(targetHistoryId, liveMessages);
    }

    commitAssistantMessage();
    await scrollAfterUserSubmit(options);

    isGenerating.value = true;
    chatStreamStore.start();
    try {
      await streamGeneration(
        createRequestPayload({
          assistantId: options.selectedAssistantId?.value || "",
          modelId: options.selectedModel?.value || "",
          input: normalized.text,
          chatId: targetHistoryId,
        }),
        {
          onChunk: (content) => {
            commitAssistantMessage({content, status: "streaming"});
            scheduleStreamScroll();
          },
          onComplete: () => {
            commitAssistantMessage({
              status: "complete",
              reasoningStatus: "completed",
            });
          },
        }
      );
      commitAssistantMessage({
        status: "complete",
        reasoningStatus: "completed",
      });
      await nextTick();
      await options.renderAfterStream();
    } catch (error) {
      if (isGenerationAbortError(error)) {
        logWarn("[useChatSubmit] 스트리밍이 중단되었습니다:", error);
        const syncedContent = await resolveGenerationResultContent(
          error.generationRequestId
        );
        const fallbackContent =
          syncedContent ||
          error.accumulated ||
          liveAssistantMessage.content ||
          "(응답 생성이 중단되었습니다.)";
        commitAssistantMessage({
          status: fallbackContent ? "complete" : "error",
          reasoningStatus: "completed",
          content: fallbackContent,
        });
      } else {
        logWarn("[useChatSubmit] 스트리밍 오류:", error);
        const syncedContent = await resolveGenerationResultContent(
          error.generationRequestId
        );
        const fallbackContent =
          syncedContent ||
          error.accumulated ||
          liveAssistantMessage.content ||
          "(응답 생성 중 오류가 발생했습니다.)";
        commitAssistantMessage({
          status: fallbackContent ? "complete" : "error",
          reasoningStatus: "completed",
          content: fallbackContent,
        });
      }
    } finally {
      isGenerating.value = false;
      chatStreamStore.finish();
    }
  }

  async function regenerateResponse(message = {}) {
    if (isGenerating.value) return;
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
    let liveMessages = [
      ...currentMessages.slice(0, assistantIndex),
      assistantMessage,
    ];
    let liveAssistantMessage = assistantMessage;
    const scheduleStreamScroll = createStreamScrollScheduler(options);

    function commitAssistantMessage(patch = {}) {
      liveAssistantMessage = {...liveAssistantMessage, ...patch};
      liveMessages = liveMessages.map((item) =>
        item.id === liveAssistantMessage.id ? liveAssistantMessage : item
      );
      options.messages.value = liveMessages;
      options.setConversation(targetHistoryId, liveMessages);
    }

    commitAssistantMessage();
    await nextTick();
    await options.scrollBottom({force: true, stable: true, autoAnswer: true});

    isGenerating.value = true;
    chatStreamStore.start();
    try {
      await streamGeneration(
        createRequestPayload({
          assistantId: options.selectedAssistantId?.value || "",
          modelId: options.selectedModel?.value || "",
          input: normalized.text,
          chatId: targetHistoryId,
        }),
        {
          onChunk: (content) => {
            commitAssistantMessage({content, status: "streaming"});
            scheduleStreamScroll();
          },
          onComplete: () => {
            commitAssistantMessage({
              status: "complete",
              reasoningStatus: "completed",
            });
          },
        }
      );
      commitAssistantMessage({
        status: "complete",
        reasoningStatus: "completed",
      });
      await nextTick();
      await options.renderAfterStream();
    } catch (error) {
      if (isGenerationAbortError(error)) {
        logWarn("[useChatSubmit] 재생성 스트리밍이 중단되었습니다:", error);
        const syncedContent = await resolveGenerationResultContent(
          error.generationRequestId
        );
        const fallbackContent =
          syncedContent ||
          error.accumulated ||
          liveAssistantMessage.content ||
          "(응답 재생성이 중단되었습니다.)";
        commitAssistantMessage({
          status: fallbackContent ? "complete" : "error",
          reasoningStatus: "completed",
          content: fallbackContent,
        });
      } else {
        logWarn("[useChatSubmit] 재생성 스트리밍 오류:", error);
        const syncedContent = await resolveGenerationResultContent(
          error.generationRequestId
        );
        const fallbackContent =
          syncedContent ||
          error.accumulated ||
          liveAssistantMessage.content ||
          "(응답 재생성 중 오류가 발생했습니다.)";
        commitAssistantMessage({
          status: fallbackContent ? "complete" : "error",
          reasoningStatus: "completed",
          content: fallbackContent,
        });
      }
    } finally {
      isGenerating.value = false;
      chatStreamStore.finish();
    }
  }

  return {isGenerating, handleSubmit, regenerateResponse};
}
