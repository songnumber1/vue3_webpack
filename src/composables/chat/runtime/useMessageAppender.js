import {createId} from "@/utils/id";

export function revokeMessageAttachments(items = []) {
  items.forEach((message) => {
    if (!Array.isArray(message.attachments)) return;
    message.attachments.forEach((file) => {
      if (file?.url?.startsWith?.("blob:")) URL.revokeObjectURL(file.url);
    });
  });
}

export function appendUserAndAssistantMessages({chatStore, chatId, normalized}) {
  const currentMessages = chatStore.messageMap[chatId] || [];
  const userMessage = {
    id: createId("message"),
    role: "user",
    content: normalized.text,
    attachments: normalized.attachments,
    createdAt: new Date().toISOString(),
  };
  const assistantMessage = {
    id: createId("message"),
    role: "assistant",
    content: "",
    reasoningContent: "",
    reasoningStatus: "thinking",
    status: "streaming",
    createdAt: new Date().toISOString(),
  };
  const nextMessages = [...currentMessages, userMessage, assistantMessage];

  chatStore.setMessages(chatId, nextMessages);
  return {messages: nextMessages, assistantMessage};
}
