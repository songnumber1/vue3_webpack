import {nextTick, ref} from "vue";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {createId} from "@/utils/id";
import {logWarn} from "@/utils/logger";
import {
  canWrite,
  isSelectedModelReasoning,
} from "./submit/chatSubmitGuards";
import {normalizePromptPayload} from "./submit/chatSubmitPayload";
import {
  createAssistantMessageCommitter,
  createAssistantStreamingPatch,
} from "./submit/chatSubmitCommitter";
import {
  createStreamScrollScheduler,
  scrollAfterUserSubmit,
} from "./submit/chatSubmitScroll";
import {runAssistantStream} from "./submit/chatSubmitStreamRunner";

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

function shouldCreateConversation(options, targetHistoryId) {
  return (
    options.route.name === "main" ||
    options.route.name === "chat-entry" ||
    !targetHistoryId
  );
}

async function ensureConversationForSubmit(options, normalized) {
  let targetHistoryId = String(options.route.params.id || "");

  if (!shouldCreateConversation(options, targetHistoryId)) {
    return targetHistoryId;
  }

  const history = await createConversationForSubmit(options, normalized);
  targetHistoryId = history.id;

  await options.router
    .push({name: "chat", params: {id: targetHistoryId}})
    .catch(() => {});
  await nextTick();

  return targetHistoryId;
}

function createSubmitCommitter(options, targetHistoryId, messages, assistantMessage) {
  return createAssistantMessageCommitter({
    chatId: targetHistoryId,
    initialMessages: messages,
    initialAssistantMessage: {
      ...assistantMessage,
      ...createAssistantStreamingPatch(isSelectedModelReasoning(options)),
    },
    messagesRef: options.messages,
    setConversation: options.setConversation,
  });
}

function createRegenerateAssistantMessage(options) {
  return {
    id: createId("message"),
    role: "assistant",
    content: "",
    ...createAssistantStreamingPatch(isSelectedModelReasoning(options)),
    createdAt: new Date().toISOString(),
  };
}

function findUserMessageForRegenerate(messages, assistantIndex) {
  return [...messages]
    .slice(0, assistantIndex)
    .reverse()
    .find((item) => item.role === "user");
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

    isGenerating.value = true;

    try {
      const targetHistoryId = await ensureConversationForSubmit(
        options,
        normalized
      );
      const {messages, assistantMessage} =
        options.appendUserAndAssistantMessages(targetHistoryId, normalized);

      options.syncHistories?.();

      const committer = createSubmitCommitter(
        options,
        targetHistoryId,
        messages,
        assistantMessage
      );
      const scheduleStreamScroll = createStreamScrollScheduler(options);

      committer.commit();
      await scrollAfterUserSubmit(options, normalized);

      chatStreamStore.start();

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

    const userMessage = findUserMessageForRegenerate(
      currentMessages,
      assistantIndex
    );
    if (!userMessage) return;

    const normalized = normalizePromptPayload({
      text: userMessage.content,
      attachments: userMessage.attachments || [],
    });
    const assistantMessage = createRegenerateAssistantMessage(options);
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
