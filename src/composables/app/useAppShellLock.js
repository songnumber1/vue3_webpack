/**
 * @file composables/app/useAppShellLock.js
 * @description Header/Footer/전역 메뉴 같은 앱 shell action의 차단 정책을 제공합니다.
 */

import {computed} from "vue";
import {useChatStore} from "@/stores/chatStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";

export function useAppShellLock() {
  const chatStore = useChatStore();
  const chatStreamStore = useChatStreamStore();
  const {isGlobalLocked, isStreamingLocked, isChatHistoryLocked} =
    useNavigationLock();

  const isAppShellActionBlocked = computed(
    () =>
      isGlobalLocked.value ||
      isStreamingLocked.value ||
      isChatHistoryLocked.value ||
      chatStreamStore.isStreaming ||
      chatStore.isNavigationLocked
  );

  const isAppNavigationBlocked = computed(
    () =>
      isGlobalLocked.value ||
      isStreamingLocked.value ||
      chatStreamStore.isStreaming
  );

  return {
    isAppShellActionBlocked,
    isAppNavigationBlocked,
  };
}
