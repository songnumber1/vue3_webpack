/**
 * @file composables/chat/history/useHistoryConversationLoader.js
 * @description 일반 main/chat route 진입 시 대화방 이력 로딩과 hidden URL 보정 흐름을 담당합니다.
 */

import {nextTick} from "vue";
import {warmupMermaidForHistoryRender} from "@/utils/mermaidRenderer";
import {isHiddenConversationUrlMode} from "@/composables/chat/navigation/conversationUrlPolicy";
import {ROUTE_NAMES} from "@/constants/routeNames";

export function useHistoryConversationLoader({
  router,
  runtime,
  systemSettingsStore,
  chatStore,
  messages,
  isMainPage,
  activeHistoryId,
  findHistory,
  beginHistoryRender,
  finishHistoryRender,
  flushConversationSwitchPaint,
  clearLazyHistoryMessages,
  setHistoryMessagesForInitialRender,
  historyMessagesLoaded,
  clearPendingSelectedIfMatched,
  clearPendingSelectedOnFailure,
  isMermaidRenderingEnabled,
  hasMermaidInHistoryMessages,
}) {
  const {ensureConversation, clearActiveSession} = runtime;

  function resetMainRouteConversation() {
    finishHistoryRender();
    clearLazyHistoryMessages();
    messages.value = [];
    chatStore.pruneInactiveMessageCache(null);
    clearActiveSession();
  }

  async function handleMissingHistoryId({isCurrentLoad}) {
    const hasPendingHiddenNavigation =
      isHiddenConversationUrlMode(systemSettingsStore.settings) &&
      Boolean(chatStore.pendingSelectedChatId);

    beginHistoryRender();
    await flushConversationSwitchPaint();
    if (!isCurrentLoad()) return;
    clearLazyHistoryMessages();
    messages.value = [];

    // URL 숨김 모드에서 좌측 대화방 클릭 직후에는 /chat 라우트가 먼저 감지되고
    // activeRoomId가 뒤이어 세팅될 수 있습니다. 이 pending 상태에서 clearActiveSession을
    // 호출하면 pendingSelectedChatId까지 지워져 첫 대화방 진입이 메인 redirect로 바뀌므로
    // 복원 가능한 방이 없는 진짜 /chat 새로고침/직접 접근일 때만 세션을 정리합니다.
    if (!hasPendingHiddenNavigation) {
      clearActiveSession();
    }
    finishHistoryRender();

    // URL 노출 모드에서는 /chat 단독 접근이 특정 대화방을 의미하지 않습니다.
    // URL 숨김 모드에서도 activeRoomId가 없는 /chat 새로고침/직접 접근은
    // 복원 가능한 대화방이 없으므로 메인으로 되돌립니다. 단, 좌측 대화방 클릭 직후
    // activeRoomId가 곧 세팅될 pending 상태는 첫 진입 로드를 막지 않기 위해 대기합니다.
    if (!hasPendingHiddenNavigation) {
      await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
    }
  }

  async function redirectMissingHistory() {
    clearPendingSelectedOnFailure(activeHistoryId.value);
    finishHistoryRender();
    // 이미 유저가 삭제했거나 권한이 박탈된 방 주소로 악성 인입된 경우 메인 페이지로 튕겨내는 가드를 발동합니다.
    await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
  }

  async function applyPendingNewSubmitHistory(history) {
    finishHistoryRender();
    clearPendingSelectedIfMatched(history.id);
    clearLazyHistoryMessages();
    messages.value = runtime.conversations.value?.[history.id] || [];
    historyMessagesLoaded.value = true;
    await nextTick();
  }

  async function hydrateHistoryConversation({history, isCurrentLoad}) {
    // 검증이 완료되면 스토어를 호출해 과거 유저와 주고받았던 기 수립 대화 목록을 정형화 로드합니다.
    chatStore.setPendingSelectedChatId(history.id);
    beginHistoryRender();
    const mermaidWarmupPromise = isMermaidRenderingEnabled()
      ? warmupMermaidForHistoryRender().catch(() => null)
      : Promise.resolve(null);

    await flushConversationSwitchPaint();
    if (!isCurrentLoad()) return;
    chatStore.pruneInactiveMessageCache(history.id);
    const loadedMessages = await ensureConversation(history.id);
    if (hasMermaidInHistoryMessages(loadedMessages)) {
      await mermaidWarmupPromise;
    }
    if (!isCurrentLoad()) return;
    setHistoryMessagesForInitialRender(loadedMessages);
    historyMessagesLoaded.value = true;
    clearPendingSelectedIfMatched(history.id);
    await nextTick();
    chatStore.pruneInactiveMessageCache(history.id);
  }

  async function loadHistoryRouteConversation({isCurrentLoad}) {
    // 케이스 1: 홈 메인 로드인 경우 화면 말풍선을 비우고 액티브 대화방 메모리 컨텍스트를 소거합니다.
    if (isMainPage.value) {
      resetMainRouteConversation();
      return;
    }

    // 케이스 3: 일반 채팅 모드인데 대상 방의 고유 ID가 식별되지 않는 예외 상황 처리
    if (!activeHistoryId.value) {
      await handleMissingHistoryId({isCurrentLoad});
      return;
    }

    // 케이스 4: 현재 메모리에 인덱싱된 대화 목록 서랍에서 타깃 방 객체를 검증 스캔합니다.
    const history = findHistory(activeHistoryId.value);
    if (!history) {
      await redirectMissingHistory();
      return;
    }

    // 새 대화 생성 직후 라우터가 chat 화면으로 이동하는 경우에는 기존 대화방 입장용
    // history render overlay를 띄우지 않습니다. 이후 submit 흐름에서 사용자 질문과 기존
    // typing("...") 표시 로직이 즉시 append되므로 빈 방 복원 처리만 조용히 마칩니다.
    if (chatStore.consumePendingNewSubmitChat(history.id)) {
      await applyPendingNewSubmitHistory(history);
      return;
    }

    await hydrateHistoryConversation({history, isCurrentLoad});
  }

  return {
    loadHistoryRouteConversation,
  };
}
