/**
 * @file composables/chat/sidebar/useChatSidebarLock.js
 * @description 좌측 대화방 메뉴에서 사용하는 action 차단 정책을 제공합니다.
 * 공통 navigation lock 원천은 useNavigationLock에서 읽고, Sidebar 화면 정책만 이 파일에서 조합합니다.
 */

import {computed} from "vue";
import {useChatStore} from "@/stores/chatStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";

export function useChatSidebarLock() {
  const chatStore = useChatStore();
  const chatStreamStore = useChatStreamStore();
  const {isGlobalLocked, isStreamingLocked, isChatHistoryLocked} =
    useNavigationLock();

  // 1차 리팩토링에서는 기존 chatStore lock과 신규 navigationLockStore를 병행합니다.
  // 다음 단계에서 legacy isNavigationLocked 의존을 점진적으로 줄입니다.
  const isStreamingBlocked = computed(
    () => chatStreamStore.isStreaming || isStreamingLocked.value
  );

  const isChatHistoryBlocked = computed(
    () =>
      isChatHistoryLocked.value ||
      Boolean(chatStore.historyNavigationLocked) ||
      Boolean(chatStore.isNavigationLocked)
  );

  const isSidebarActionBlocked = computed(
    () =>
      isGlobalLocked.value ||
      isStreamingBlocked.value ||
      isChatHistoryBlocked.value
  );

  const isHistorySelectBlocked = computed(() => isSidebarActionBlocked.value);
  const isHistoryMenuBlocked = computed(() => isSidebarActionBlocked.value);
  const isNewChatBlocked = computed(() => isSidebarActionBlocked.value);
  const isAssistantSelectBlocked = computed(() => isSidebarActionBlocked.value);
  const isChatSearchBlocked = computed(() => isSidebarActionBlocked.value);

  return {
    isSidebarActionBlocked,
    isHistorySelectBlocked,
    isHistoryMenuBlocked,
    isNewChatBlocked,
    isAssistantSelectBlocked,
    isChatSearchBlocked,
  };
}
