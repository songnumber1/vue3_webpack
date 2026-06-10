/**
 * @file composables/chat/conversation/useChatPageLock.js
 * @description 채팅 대화 화면 submit/regenerate/scroll 계열 action 차단 정책을 제공합니다.
 */

import {computed} from "vue";
import {useChatStore} from "@/stores/chatStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";

function toValue(source) {
  return Boolean(source?.value ?? source);
}

export function useChatPageLock(options = {}) {
  const chatStore = useChatStore();
  const chatStreamStore = useChatStreamStore();
  const {isGlobalLocked, isStreamingLocked, isChatHistoryLocked} =
    useNavigationLock();

  const isHistoryBusy = computed(
    () =>
      isChatHistoryLocked.value ||
      chatStore.historyNavigationLocked ||
      toValue(options.isHistoryRendering)
  );

  const isConversationActionBlocked = computed(
    () => isGlobalLocked.value || isStreamingLocked.value || isHistoryBusy.value
  );

  const isSubmitBlocked = computed(
    () =>
      isConversationActionBlocked.value ||
      chatStreamStore.isStreaming ||
      toValue(options.readonly) ||
      toValue(options.isGenerating) ||
      toValue(options.isActiveModelUnavailable)
  );

  const isRegenerateBlocked = computed(
    () =>
      isConversationActionBlocked.value ||
      toValue(options.readonly) ||
      toValue(options.isGenerating)
  );

  const isLoadPreviousBlocked = computed(
    () => isGlobalLocked.value || isStreamingLocked.value || isHistoryBusy.value
  );

  const isScrollButtonBlocked = computed(
    () => isGlobalLocked.value || isHistoryBusy.value
  );

  return {
    isConversationActionBlocked,
    isSubmitBlocked,
    isRegenerateBlocked,
    isLoadPreviousBlocked,
    isScrollButtonBlocked,
  };
}
