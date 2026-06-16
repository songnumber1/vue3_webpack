/**
 * @file composables/chat/shared/useSharedConversationLoader.js
 * @description 공유 대화방 route 로딩, hidden URL 보정, not-found redirect를 담당합니다.
 */

import {nextTick} from "vue";
import {getSharedConversation} from "@/composables/chat/useSharedChat";
import {ROUTE_NAMES} from "@/constants/routeNames";

export function useSharedConversationLoader({
  t,
  router,
  chatStore,
  messages,
  activeHistoryId,
  getSharedEntryId,
  beginHistoryRender,
  finishHistoryRender,
  finishHistoryRenderImmediately,
  flushConversationSwitchPaint,
  clearLazyHistoryMessages,
  setHistoryMessagesForInitialRender,
  historyMessagesLoaded,
}) {
  async function redirectSharedNotFound() {
    const message = t("chat.sharedNotFoundMessage");
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(message);
    }
    chatStore.clearActiveRoom();
    clearLazyHistoryMessages();
    messages.value = [];
    // 공유 URL 검증 실패는 더 이상 렌더 완료 대기/스크롤 보정이 필요하지 않습니다.
    // finishHistoryRender()는 nextTick/paint 이후에 lock을 해제하므로, alert 확인 직후
    // main 이동이 router guard의 chat-history lock에 막힐 수 있습니다.
    // 실패 경로에서는 즉시 렌더 상태와 lock을 정리한 뒤 메인으로 이동합니다.
    finishHistoryRenderImmediately();
    await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
  }

  async function loadSharedRouteConversation({isCurrentLoad}) {
    beginHistoryRender();
    await flushConversationSwitchPaint();
    if (!isCurrentLoad()) return;

    const sharedEntryId = getSharedEntryId();
    if (sharedEntryId) {
      const result = await getSharedConversation(sharedEntryId);
      if (!isCurrentLoad()) return;
      if (!result.exists) {
        await redirectSharedNotFound(result);
        return;
      }
      chatStore.setActiveSharedRoom(result.shareId || sharedEntryId);
      await router.replace({name: ROUTE_NAMES.SHARED}).catch(() => {});
      // /shared/:id -> /shared replace 직후 route watcher가 새 loadRouteConversation을
      // 시작할 수 있습니다. 이 경우 현재 load는 stale 상태가 되므로 메시지를
      // 중복 세팅하지 않고 새 라우트 기준 로드에게 넘깁니다.
      if (!isCurrentLoad()) return;
      setHistoryMessagesForInitialRender(result.messages);
      historyMessagesLoaded.value = true;
      await nextTick();
      finishHistoryRender();
      return;
    }

    if (!activeHistoryId.value) {
      clearLazyHistoryMessages();
      messages.value = [];
      finishHistoryRender();
      await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
      return;
    }

    const result = await getSharedConversation(activeHistoryId.value);
    if (!isCurrentLoad()) return;
    if (!result.exists) {
      await redirectSharedNotFound(result);
      return;
    }

    setHistoryMessagesForInitialRender(result.messages);
    historyMessagesLoaded.value = true;
    await nextTick();
    finishHistoryRender();
  }

  return {
    loadSharedRouteConversation,
    redirectSharedNotFound,
  };
}
