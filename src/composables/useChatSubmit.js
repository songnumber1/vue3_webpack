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


const STREAM_TYPEWRITER_DELAY_MS = 28;

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function createTypewriterRenderer(commit) {
  let targetContent = "";
  let visibleLength = 0;
  let running = false;
  let stopped = false;

  async function pump() {
    if (running) return;
    running = true;

    try {
      while (!stopped) {
        const targetChars = Array.from(targetContent);
        if (visibleLength >= targetChars.length) break;

        visibleLength += 1;
        commit(targetChars.slice(0, visibleLength).join(""));
        await sleep(STREAM_TYPEWRITER_DELAY_MS);
      }
    } finally {
      running = false;
      const targetChars = Array.from(targetContent);
      if (!stopped && visibleLength < targetChars.length) {
        void pump();
      }
    }
  }

  return {
    update(content = "") {
      targetContent = String(content || "");
      void pump();
    },
    async flush() {
      while (!stopped) {
        const targetChars = Array.from(targetContent);
        if (!running && visibleLength >= targetChars.length) break;
        await sleep(STREAM_TYPEWRITER_DELAY_MS);
      }
    },
    stop() {
      stopped = true;
    },
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
    if (options.route.name === "main" || !targetHistoryId) {
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
    let liveMessages = messages;
    let liveAssistantMessage = {
      ...assistantMessage,
      status: "streaming",
      reasoningContent: buildMockReasoningContent(normalized),
      reasoningStatus: "thinking",
    };

    function commitAssistantMessage(patch = {}) {
      liveAssistantMessage = {...liveAssistantMessage, ...patch};
      liveMessages = liveMessages.map((message) =>
        message.id === liveAssistantMessage.id ? liveAssistantMessage : message
      );
      options.messages.value = liveMessages;
      options.setConversation(targetHistoryId, liveMessages);
    }

    commitAssistantMessage();
    await nextTick();
    await options.scrollBottom({force: true, stable: true});

    isGenerating.value = true;
    chatStreamStore.start();
    const typewriter = createTypewriterRenderer((content) => {
      commitAssistantMessage({content, status: "streaming"});
    });

    try {
      await streamGeneration(
        {
          assistantId: options.selectedAssistantId?.value || "",
          modelId: options.selectedModel?.value || "",
          input: normalized.text,
        },
        {
          onChunk: async (content) => {
            typewriter.update(content);
            await nextTick();
            await options.scrollBottom({force: true, stable: true});
          },
          onComplete: async () => {
            await typewriter.flush();
            commitAssistantMessage({status: "complete", reasoningStatus: "completed"});
          },
        }
      );
      await typewriter.flush();
      commitAssistantMessage({status: "complete", reasoningStatus: "completed"});
      await nextTick();
      await options.renderAfterStream();
    } catch (error) {
      typewriter.stop();
      logWarn("[useChatSubmit] 스트리밍 오류:", error);
      commitAssistantMessage({
        status: "error",
        reasoningStatus: "completed",
        content:
          liveAssistantMessage.content || "(응답 생성 중 오류가 발생했습니다.)",
      });
    } finally {
      isGenerating.value = false;
      chatStreamStore.finish();
    }
  }

  return {isGenerating, handleSubmit};
}
