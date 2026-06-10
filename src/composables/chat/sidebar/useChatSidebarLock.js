/**
 * @file composables/chat/sidebar/useChatSidebarLock.js
 * @description 좌측 대화방 메뉴에서 사용하는 action 차단 정책을 제공합니다.
 * 공통 navigation lock 원천은 useNavigationLock에서 읽고, Sidebar 화면 정책만 이 파일에서 조합합니다.
 */

import {computed} from "vue";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";

export function useChatSidebarLock() {
  const chatStreamStore = useChatStreamStore();
  const {isGlobalLocked, isStreamingLocked, isChatHistoryLocked} =
    useNavigationLock();

  const isStreamingBlocked = computed(
    () => chatStreamStore.isStreaming || isStreamingLocked.value
  );

  const isChatHistoryBlocked = computed(() => isChatHistoryLocked.value);

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
