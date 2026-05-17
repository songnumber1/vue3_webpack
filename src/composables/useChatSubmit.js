import {nextTick, ref} from 'vue';
import {normalizePromptPayload} from '@/services/chatStream/chatResponseBuilder';
import {streamAssistantResponse} from '@/services/chatStream/chatStreamService';

/**
 * @description 채팅 전송과 assistant 응답 스트림 상태를 관리합니다.
 * @param {*} options - router, route, message/cache 관련 의존성입니다.
 * @returns {{isGenerating: import('vue').Ref<boolean>, handleSubmit: Function}} 전송 상태와 실행 함수입니다.
 */
export function useChatSubmit(options) {
  const isGenerating = ref(false);

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

    try {
      isGenerating.value = true;
      await streamAssistantResponse(
        normalized,
        (chunk) => {
          assistantMessage.content = chunk;
          options.setConversation(targetHistoryId, messages);
        },
        {delay: 9}
      );
      options.setConversation(targetHistoryId, messages);
    } finally {
      isGenerating.value = false;
    }

    await nextTick();
    await options.renderAfterStream();
  }

  return {isGenerating, handleSubmit};
}
