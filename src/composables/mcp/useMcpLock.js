/**
 * @file composables/mcp/useMcpLock.js
 * @description MCP 화면 전용 lock 정책 확장 지점을 제공합니다.
 */

import {computed} from "vue";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";

export function useMcpLock() {
  const {isGlobalLocked, isStreamingLocked} = useNavigationLock();

  const isMcpActionBlocked = computed(
    () => isGlobalLocked.value || isStreamingLocked.value
  );

  return {isMcpActionBlocked};
}
