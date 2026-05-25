/**
 * @file composables/runtime/useInteractionGuard.js
 * @description 런타임 상호작용 제한, 모바일/WebView 환경 상태 같은 전역 동작 제어 composable입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

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
