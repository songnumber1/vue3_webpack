import {computed, nextTick} from "vue";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useChatStore} from "@/stores/chatStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {createId} from "@/utils/id";
import {logWarn} from "@/utils/logger";
import {shouldUseServerApi} from "@/constants/apiMode";
import {canWrite, isSelectedModelReasoning} from "./submit/chatSubmitGuards";
import {normalizePromptPayload} from "./submit/chatSubmitPayload";
import {
  createAssistantMessageCommitter,
  createAssistantStreamingPatch,
} from "./submit/streamingMessageCommitter";
import {
  createStreamScrollScheduler,
  scrollAfterUserSubmit,
} from "./submit/chatSubmitScroll";
import {runAssistantStream} from "./submit/chatSubmitStreamRunner";
import {
  applyHiddenConversationActiveRoom,
  createConversationRoute,
  resolveActiveChatId,
} from "@/composables/chat/navigation/conversationUrlPolicy";
// chatStreamStore.isStreaming을 생성 중 상태의 단일 기준으로 사용합니다.

function normalizeChatId(chatId) {
  return String(chatId || "").trim();
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
    if (shouldUseServerApi()) {
      logWarn("[useChatSubmit] new.do 호출 실패:", error);
      throw error;
    }

    logWarn(
      "[useChatSubmit] new.do 호출 실패, local conversation으로 대체:",
      error
    );
    return options.createLocalConversation(normalized);
  }
}

function shouldCreateConversation(options, targetHistoryId) {
  // URL 숨김 모드에서는 기존 대화방도 /chat(chat-entry) 라우트를 사용합니다.
  // 따라서 라우트 이름만으로 새 대화 여부를 판단하면 기존 대화방 추가 질문이
  // new.do로 잘못 분기될 수 있습니다. visible/hidden 정책을 모두 반영한
  // active chat id가 있으면 항상 기존 대화방으로 처리합니다.
  if (targetHistoryId) return false;

  return options.route.name === "main" || options.route.name === "chat-entry";
}

async function ensureConversationForSubmit(
  options,
  normalized,
  currentHistoryId
) {
  let targetHistoryId = normalizeChatId(currentHistoryId);

  if (!shouldCreateConversation(options, targetHistoryId)) {
    return targetHistoryId;
  }

  const history = await createConversationForSubmit(options, normalized);
  targetHistoryId = normalizeChatId(history?.id);

  if (!targetHistoryId) {
    throw new Error("new.do response does not contain chatId.");
  }

  // 새 대화는 기존 방 입장용 historyRender overlay 대상이 아닙니다.
  // 라우트 이동보다 먼저 호출부에서 사용자 질문과 assistant typing("...") 메시지를
  // store에 append해야 메인 화면 첫 질문도 기존 채팅방 질문과 동일하게 보입니다.
  options.markNewSubmitConversation?.(targetHistoryId);

  return targetHistoryId;
}

function createSubmitCommitter(
  options,
  targetHistoryId,
  messages,
  assistantMessage
) {
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
  const chatStreamStore = useChatStreamStore();
  const isGenerating = computed(() => chatStreamStore.isStreaming);
  const apiRequestStore = useApiRequestStore();
  const chatStore = useChatStore();
  const systemSettingsStore = useSystemSettingsStore();

  async function submitPrompt(payload) {
    const normalized = normalizePromptPayload(payload);
    if (
      chatStore.isActiveSharedRoom ||
      !canWrite(options) ||
      (!normalized.text && normalized.attachments.length === 0) ||
      chatStreamStore.isStreaming
    ) {
      return;
    }

    chatStreamStore.start();

    const initialHistoryId = normalizeChatId(
      resolveActiveChatId({
        route: options.route,
        chatStore,
        settings: systemSettingsStore.settings,
      })
    );
    const isNewConversationSubmit = shouldCreateConversation(
      options,
      initialHistoryId
    );
    let overlaySuppressed = false;

    if (isNewConversationSubmit) {
      apiRequestStore.suppressOverlay();
      overlaySuppressed = true;
    }

    try {
      const targetHistoryId = await ensureConversationForSubmit(
        options,
        normalized,
        initialHistoryId
      );

      if (isNewConversationSubmit) {
        chatStore.promoteDraftPromptToolSettingsToChat(targetHistoryId);
      }

      const {messages, assistantMessage} =
        options.appendUserAndAssistantMessages(targetHistoryId, normalized);

      const committer = createSubmitCommitter(
        options,
        targetHistoryId,
        messages,
        assistantMessage
      );
      const scheduleStreamScroll = createStreamScrollScheduler(options);

      committer.commit();

      if (isNewConversationSubmit) {
        const nextRoute = createConversationRoute({
          chatId: targetHistoryId,
          settings: systemSettingsStore.settings,
        });
        // chatStreamStore.isStreaming 상태에서 새 채팅방으로 입장해야 하므로,
        // URL 정책에 따라 내부 /chat/:id 또는 /chat 라우팅만 1회 허용합니다.
        // 사용자가 클릭한 다른 대화방/Studio/MCP 이동은 router guard에서 계속 차단됩니다.
        chatStreamStore.allowNavigationTo(nextRoute);
        await options.router.push(nextRoute).catch(() => {
          chatStreamStore.clearAllowedNavigation();
        });
        applyHiddenConversationActiveRoom({
          chatId: targetHistoryId,
          chatStore,
          settings: systemSettingsStore.settings,
        });
      }

      await nextTick();
      options.syncHistories?.();
      await scrollAfterUserSubmit(options, normalized);

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
      if (overlaySuppressed) {
        apiRequestStore.resumeOverlay();
        overlaySuppressed = false;
      }
      chatStreamStore.finish();
    }
  }

  async function regenerateResponse(message = {}) {
    if (
      chatStore.isActiveSharedRoom ||
      !canWrite(options) ||
      chatStreamStore.isStreaming
    ) {
      return;
    }

    const targetHistoryId = normalizeChatId(
      resolveActiveChatId({
        route: options.route,
        chatStore,
        settings: systemSettingsStore.settings,
      })
    );
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

    // 자동 스크롤 OFF 재생성에서는 질문 박스를 화면 상단에 배치하기 위한
    // 하단 spacer 계산이 필요합니다. 이 계산은 MessageList의 loading=true 조건에서만
    // 동작하므로 commit/scroll 전에 생성 상태를 먼저 열어 둡니다.
    chatStreamStore.start();

    committer.commit();
    await nextTick();
    if (options.autoScrollOnAnswer?.value) {
      await options.scrollBottom({force: true, stable: true, autoAnswer: true});
    } else {
      await options.scrollLatestUserMessage?.({
        behavior: "auto",
        stable: false,
        initialOnly: true,
        offset: 16,
        pageFallback: false,
      });
    }

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
      chatStreamStore.finish();
    }
  }

  return {
    isGenerating,
    submit: submitPrompt,
    regenerate: regenerateResponse,
  };
}
