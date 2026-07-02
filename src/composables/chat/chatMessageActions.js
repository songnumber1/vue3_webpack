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

export function createChatUser(normalized) {
  return {
    id: createId("message"),
    role: "user",
    content: normalized.text,
    attachments: normalized.attachments,
    createdAt: new Date().toISOString(),
  };
}

export function createChatResponse(patch = {}) {
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

export function appendUserAndChatResponses(chatId, normalized) {
  const chatStore = useChatStore();
  const currentMessages = chatStore.messageMap[chatId] || [];
  const userMessage = createChatUser(normalized);
  const assistantMessage = createChatResponse();
  const nextMessages = [...currentMessages, userMessage, assistantMessage];

  chatStore.setMessages(chatId, nextMessages);
  return {messages: nextMessages, assistantMessage};
}

export function patchChatResponse(messages, assistantMessage, patch = {}) {
  const nextChatResponse = {...assistantMessage, ...patch};
  const nextMessages = messages.map((message) =>
    message.id === nextChatResponse.id ? nextChatResponse : message
  );

  return {
    messages: nextMessages,
    assistantMessage: nextChatResponse,
  };
}

export function appendAssistantChunk(assistantMessage, content) {
  return {
    ...assistantMessage,
    content,
    status: "streaming",
  };
}

export function markChatResponseError(assistantMessage, errorPatch = {}) {
  return {
    ...assistantMessage,
    status: "error",
    error: true,
    reasoningStatus: "completed",
    ...errorPatch,
  };
}

export function createChatResponseCommitter(
  chatId,
  initialMessages,
  initialChatResponse,
  setConversation
) {
  let liveMessages = initialMessages;
  let liveChatResponse = initialChatResponse;

  function commit(patch = {}) {
    const nextState = patchChatResponse(
      liveMessages,
      liveChatResponse,
      patch
    );

    liveChatResponse = nextState.assistantMessage;
    liveMessages = nextState.messages;
    setConversation(chatId, liveMessages);
  }

  return {
    commit,
    getChatResponse: () => liveChatResponse,
    getMessages: () => liveMessages,
  };
}
