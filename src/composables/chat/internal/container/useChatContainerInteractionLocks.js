import {computed} from "vue";
import {useChatPageLock} from "@/composables/chat/conversation/useChatPageLock";

export function useChatContainerInteractionLocks({
  isReadOnly,
  isGenerating,
  isHistoryRendering,
  isActiveModelUnavailable,
}) {
  const chatPageLock = useChatPageLock({
    readonly: isReadOnly,
    isGenerating,
    isHistoryRendering,
    isActiveModelUnavailable,
  });

  const isStudioDetailBlocked = computed(
    () =>
      chatPageLock.isConversationActionBlocked?.value ||
      isGenerating.value ||
      isHistoryRendering.value
  );

  return {
    chatPageLock,
    isStudioDetailBlocked,
  };
}
