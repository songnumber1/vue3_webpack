import {computed, nextTick} from 'vue';
import {loadSharedConversation} from '@/composables/useSharedChat';

export function useChatRouteConversation({
  props,
  t,
  route,
  router,
  messages,
  activeSession,
  currentAssistant,
  getHistory,
  ensureConversation,
  clearCurrentChatSelection,
  scrollToRouteBottom,
}) {
  const activeHistoryId = computed(() => {
    if (props.mode === 'chat') return route.params.id;
    if (props.mode === 'shared') return route.params.shareId;
    return null;
  });

  const activeHistory = computed(() => getHistory(activeHistoryId.value));

  const activeConversationTitle = computed(() => {
    if (props.mode === 'shared') {
      return t('chat.sharedConversationTitle', {id: activeHistoryId.value || ''}).trim();
    }
    return activeHistory.value?.title || '';
  });

  const workspaceAssistantLabel = computed(() => {
    if (activeSession.value?.displayAssistantLabel) {
      return activeSession.value.displayAssistantLabel;
    }
    if (
      activeSession.value?.assistantLabel &&
      !activeSession.value?.isModelUnavailable
    ) {
      return activeSession.value.assistantLabel;
    }
    return currentAssistant.value?.label || t('chat.assistant');
  });

  async function loadRouteConversation() {
    if (props.mode === 'main') {
      messages.value = [];
      clearCurrentChatSelection();
      return;
    }

    if (props.mode === 'shared') {
      messages.value = await loadSharedConversation(activeHistoryId.value);
      await scrollToRouteBottom();
      return;
    }

    const history = getHistory(activeHistoryId.value);
    if (!history) {
      await router.replace('/');
      return;
    }
    messages.value = await ensureConversation(history.id);
    await nextTick();
    await scrollToRouteBottom();
  }

  return {
    activeHistoryId,
    activeHistory,
    activeConversationTitle,
    workspaceAssistantLabel,
    loadRouteConversation,
  };
}
