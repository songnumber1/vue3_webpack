import {computed} from "vue";
import {useChatStreamStore} from "@/stores/chatStreamStore";

/**
 * Provides a single runtime source for UI/action blocking while chat streaming is active.
 * Components can read `isInteractionBlocked` directly instead of receiving it through props.
 */
export function useInteractionGuard() {
  const chatStreamStore = useChatStreamStore();

  const isInteractionBlocked = computed(() => chatStreamStore.isStreaming);

  function isBlocked() {
    return isInteractionBlocked.value;
  }

  function guard(action) {
    if (isBlocked()) return false;
    if (typeof action === "function") action();
    return true;
  }

  return {
    isInteractionBlocked,
    isBlocked,
    guard,
  };
}
