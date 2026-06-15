/**
 * @file composables/chat/internal/route/useChatRouteLoader.js
 * @description route 전환 시 shared/history loader를 선택하고 stale load를 차단합니다.
 */

/**
 * route load sequence를 내부에서 관리해 오래된 비동기 로딩 결과가 최신 화면을 덮지 않게 합니다.
 */
export function useChatRouteLoader({
  isSharedPage,
  loadSharedRouteConversation,
  loadHistoryRouteConversation,
  onLoadError,
}) {
  let routeConversationLoadSeq = 0;

  async function loadRouteConversation() {
    const loadSeq = ++routeConversationLoadSeq;
    const isCurrentLoad = () => loadSeq === routeConversationLoadSeq;

    try {
      if (isSharedPage.value) {
        await loadSharedRouteConversation({isCurrentLoad});
        return;
      }

      await loadHistoryRouteConversation({isCurrentLoad});
    } catch (error) {
      await onLoadError?.(error, {isCurrentLoad});
    }
  }

  function invalidateRouteLoad() {
    routeConversationLoadSeq += 1;
  }

  return {
    loadRouteConversation,
    invalidateRouteLoad,
  };
}
