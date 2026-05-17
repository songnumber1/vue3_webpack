import {nextTick, ref} from 'vue';
import {CHAT_STREAM_STATE, createMockChatStream} from '@/services/chatStream';

function normalizePromptPayload(payload) {
  if (typeof payload === 'string') return {text: payload.trim(), attachments: []};
  return {
    text: String(payload?.text || '').trim(),
    attachments: Array.isArray(payload?.attachments) ? payload.attachments : [],
  };
}

function buildAssistantResponse(normalized, t) {
  const fileSummary = normalized.attachments.length
    ? t('chat.mockResponse.attachmentSummary', {count: normalized.attachments.length})
    : '';
  return t('chat.mockResponse.body', {
    input: normalized.text || t('chat.mockResponse.emptyAttachmentRequest'),
    fileSummary,
  });
}

export function useChatSubmit(options) {
  const isGenerating = ref(false);
  const streamState = ref(CHAT_STREAM_STATE.IDLE);
  const streamError = ref(null);
  const t = options.t || ((key) => key);
  let activeStream = null;

  function setStreamState(nextState) {
    streamState.value = nextState;
    isGenerating.value =
      nextState === CHAT_STREAM_STATE.SUBMITTING ||
      nextState === CHAT_STREAM_STATE.STREAMING;
  }

  function abortStream(reason = 'user-abort') {
    activeStream?.abort(reason);
  }

  async function handleSubmit(payload) {
    const normalized = normalizePromptPayload(payload);
    if (
      (!normalized.text && normalized.attachments.length === 0) ||
      isGenerating.value
    ) {
      return;
    }

    let targetHistoryId = String(options.route.params.id || '');
    if (options.route.name === 'main') {
      const history = options.createLocalConversation(normalized);
      targetHistoryId = history.id;
      await options.router.push({name: 'chat', params: {id: targetHistoryId}});
      await nextTick();
    }

    const {messages, assistantMessage} = options.appendUserAndAssistantMessages(
      targetHistoryId,
      normalized
    );
    options.messages.value = messages;
    await nextTick();
    await options.scrollBottom({force: true, stable: true});

    streamError.value = null;
    activeStream = createMockChatStream({onStateChange: setStreamState});
    try {
      await activeStream.start({
        text: buildAssistantResponse(normalized, t),
        delay: 9,
        onChunk: (chunk) => {
          assistantMessage.content = chunk;
          options.setConversation(targetHistoryId, messages);
        },
      });
    } catch (error) {
      streamError.value = error;
      setStreamState(CHAT_STREAM_STATE.ERROR);
      throw error;
    } finally {
      if (streamState.value !== CHAT_STREAM_STATE.ERROR) {
        setStreamState(CHAT_STREAM_STATE.IDLE);
      }
      activeStream = null;
    }
    options.setConversation(targetHistoryId, messages);
    await nextTick();
    await options.renderAfterStream();
  }

  return {isGenerating, streamState, streamError, abortStream, handleSubmit};
}
