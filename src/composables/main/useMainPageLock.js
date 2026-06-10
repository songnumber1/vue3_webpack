/**
 * @file composables/main/useMainPageLock.js
 * @description 메인 화면 input, 예시 프롬프트, Assistant 선택에 대한 차단 정책을 제공합니다.
 */

import {computed} from "vue";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";

export function useMainPageLock() {
  const chatStreamStore = useChatStreamStore();
  const {isGlobalLocked, isStreamingLocked, isChatHistoryLocked} =
    useNavigationLock();

  const isMainPageActionBlocked = computed(
    () =>
      isGlobalLocked.value ||
      isStreamingLocked.value ||
      chatStreamStore.isStreaming ||
      isChatHistoryLocked.value
  );

  const isPromptSubmitBlocked = computed(() => isMainPageActionBlocked.value);
  const isPromptExampleBlocked = computed(() => isMainPageActionBlocked.value);
  const isMainAssistantSelectBlocked = computed(
    () => isMainPageActionBlocked.value
  );

  return {
    isMainPageActionBlocked,
    isPromptSubmitBlocked,
    isPromptExampleBlocked,
    isMainAssistantSelectBlocked,
  };
}
