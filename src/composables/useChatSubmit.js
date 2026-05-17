import {nextTick, ref} from 'vue';
import {streamText} from '@/utils/fakeStream';

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
  const t = options.t || ((key) => key);

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

    isGenerating.value = true;
    try {
      await streamText(
        buildAssistantResponse(normalized, t),
        (chunk) => {
          assistantMessage.content = chunk;
          options.setConversation(targetHistoryId, messages);
        },
        {delay: 9}
      );
    } finally {
      isGenerating.value = false;
    }
    options.setConversation(targetHistoryId, messages);
    await nextTick();
    await options.renderAfterStream();
  }

  return {isGenerating, handleSubmit};
}
