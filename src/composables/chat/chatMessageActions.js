import {useChatStore} from "@/stores/chatStore";
import {createId} from "@/utils/id";

export function revokeMessageAttachments(items = []) {
  items.forEach((message) => {
    if (!Array.isArray(message.attachments)) return;
    message.attachments.forEach((file) => {
      if (file?.url?.startsWith?.("blob:")) URL.revokeObjectURL(file.url);
    });
  });
}

export function createAssistantStreamingPatch(isReasoning) {
  return {
    status: "streaming",
    isReasoning,
    reasoningContent: "",
    reasoningStatus: isReasoning ? "thinking" : "completed",
  };
}

export function createUserMessage(normalized) {
  return {
    id: createId("message"),
    role: "user",
    content: normalized.text,
    attachments: normalized.attachments,
    createdAt: new Date().toISOString(),
  };
}

export function createAssistantMessage(patch = {}) {
  return {
    id: createId("message"),
    role: "assistant",
    content: "",
    reasoningContent: "",
    reasoningStatus: "thinking",
    status: "streaming",
    createdAt: new Date().toISOString(),
    ...patch,
  };
}

export function appendUserAndAssistantMessages(chatId, normalized) {
  const chatStore = useChatStore();
  const currentMessages = chatStore.messageMap[chatId] || [];
  const userMessage = createUserMessage(normalized);
  const assistantMessage = createAssistantMessage();
  const nextMessages = [...currentMessages, userMessage, assistantMessage];

  chatStore.setMessages(chatId, nextMessages);
  return {messages: nextMessages, assistantMessage};
}

export function patchAssistantMessage(messages, assistantMessage, patch = {}) {
  const nextAssistantMessage = {...assistantMessage, ...patch};
  const nextMessages = messages.map((message) =>
    message.id === nextAssistantMessage.id ? nextAssistantMessage : message
  );

  return {
    messages: nextMessages,
    assistantMessage: nextAssistantMessage,
  };
}

export function appendAssistantChunk(assistantMessage, content) {
  return {
    ...assistantMessage,
    content,
    status: "streaming",
  };
}

export function markAssistantMessageError(assistantMessage, errorPatch = {}) {
  return {
    ...assistantMessage,
    status: "error",
    error: true,
    reasoningStatus: "completed",
    ...errorPatch,
  };
}

export function createAssistantMessageCommitter(
  chatId,
  initialMessages,
  initialAssistantMessage,
  setConversation
) {
  let liveMessages = initialMessages;
  let liveAssistantMessage = initialAssistantMessage;

  function commit(patch = {}) {
    const nextState = patchAssistantMessage(
      liveMessages,
      liveAssistantMessage,
      patch
    );

    liveAssistantMessage = nextState.assistantMessage;
    liveMessages = nextState.messages;
    setConversation(chatId, liveMessages);
  }

  return {
    commit,
    getAssistantMessage: () => liveAssistantMessage,
    getMessages: () => liveMessages,
  };
}
