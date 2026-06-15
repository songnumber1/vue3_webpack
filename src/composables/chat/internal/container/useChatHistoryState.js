/**
 * @file composables/chat/internal/container/useChatHistoryState.js
 * @description active history 조회와 pending selected chat 정리를 담당하는 작은 상태 유틸입니다.
 */

import {computed} from "vue";

function normalizeId(value) {
  return String(value || "").trim();
}

export function useChatHistoryState({histories, activeHistoryId, chatStore}) {
  function findHistory(id) {
    const targetId = normalizeId(id);
    if (!targetId) return null;
    return (
      histories.value.find((history) => normalizeId(history.id) === targetId) ||
      null
    );
  }

  const activeHistory = computed(() => findHistory(activeHistoryId.value));

  function clearPendingSelectedIfMatches(chatId) {
    const pendingId = normalizeId(chatStore.pendingSelectedChatId);
    const targetId = normalizeId(chatId);
    if (!pendingId || pendingId === targetId) {
      chatStore.clearPendingSelectedChatId();
    }
  }

  return {
    activeHistory,
    findHistory,
    clearPendingSelectedIfMatched: clearPendingSelectedIfMatches,
    clearPendingSelectedOnFailure: clearPendingSelectedIfMatches,
  };
}
