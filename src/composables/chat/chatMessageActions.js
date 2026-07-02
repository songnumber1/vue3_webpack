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
