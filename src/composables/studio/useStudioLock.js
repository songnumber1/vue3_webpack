/**
 * @file composables/studio/useStudioLock.js
 * @description Studio 화면 전용 lock 정책 확장 지점을 제공합니다.
 */

import {computed} from "vue";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";

export function useStudioLock() {
  const {isGlobalLocked, isStreamingLocked} = useNavigationLock();

  const isStudioActionBlocked = computed(
    () => isGlobalLocked.value || isStreamingLocked.value
  );

  return {isStudioActionBlocked};
}
