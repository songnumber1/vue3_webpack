import {nextTick, ref} from "vue";
import {streamGeneration} from "@/api/sse/sse";
import {logWarn} from "@/utils/logger";
import {useChatStreamStore} from "@/stores/chatStreamStore";

function normalizePromptPayload(payload) {
  if (typeof payload === "string")
    return {text: payload.trim(), attachments: []};
  return {
    text: String(payload?.text || "").trim(),
    attachments: Array.isArray(payload?.attachments) ? payload.attachments : [],
  };
}

function buildMockReasoningContent(normalized) {
  const target = normalized.text || "첨부 기반 요청";
  return `사용자 요청을 먼저 분해하고 답변에 필요한 항목을 정리했습니다.\n\n- 요청: ${target}\n- Assistant/Model payload를 생성했습니다.\n- 스트림 응답이 완료되기 전까지 메시지 액션은 숨김 처리됩니다.`;
}

export function updateAssistantReasoningTitle(message, status = "completed") {
  if (!message) return;
  message.reasoningStatus = status;
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
    if (options.route.name === "main") {
      const history = options.createLocalConversation(normalized);
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
    options.messages.value = messages;
    await nextTick();
    await options.scrollBottom({force: true, stable: true});

    assistantMessage.status = "streaming";
    assistantMessage.reasoningContent = buildMockReasoningContent(normalized);
    updateAssistantReasoningTitle(assistantMessage, "thinking");

    isGenerating.value = true;
    chatStreamStore.start();
    try {
      await streamGeneration(
        {
          assistantId: options.selectedAssistantId?.value || "",
          modelId: options.selectedModel?.value || "",
          input: normalized.text,
        },
        {
          onChunk: (content) => {
            assistantMessage.content = content;
            assistantMessage.status = "streaming";
            options.setConversation(targetHistoryId, messages);
          },
          onComplete: () => {
            assistantMessage.status = "complete";
          },
        }
      );
      updateAssistantReasoningTitle(assistantMessage, "completed");
      assistantMessage.status = "complete";
      options.setConversation(targetHistoryId, messages);
      await nextTick();
      await options.renderAfterStream();
    } catch (error) {
      logWarn("[useChatSubmit] 스트리밍 오류:", error);
      updateAssistantReasoningTitle(assistantMessage, "completed");
      assistantMessage.status = "error";
      assistantMessage.content =
        assistantMessage.content || "(응답 생성 중 오류가 발생했습니다.)";
      options.setConversation(targetHistoryId, messages);
    } finally {
      isGenerating.value = false;
      chatStreamStore.finish();
    }
  }

  return {isGenerating, handleSubmit};
}
