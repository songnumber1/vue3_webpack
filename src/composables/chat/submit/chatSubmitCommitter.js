import {nextTick} from "vue";

export function createAssistantStreamingPatch(isReasoning) {
  return {
    status: "streaming",
    isReasoning,
    reasoningContent: "",
    reasoningStatus: isReasoning ? "thinking" : "completed",
  };
}

export function createAssistantMessageCommitter({
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

export async function commitFirstAnswerChunk({content, getAssistantMessage, commit}) {
  if (getAssistantMessage().reasoningStatus === "thinking") {
    commit({reasoningStatus: "completed"});
    await nextTick();
  }

  commit({content, status: "streaming"});
}
