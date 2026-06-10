/**
 * @file composables/navigation/useNavigationLock.js
 * @description navigationLockStore에 접근하는 공통 raw lock composable입니다.
 *
 * 이 composable은 화면별 차단 정책을 만들지 않습니다.
 * Sidebar/Main/Chat/Studio/MCP 등 영역별 정책은 각 영역 composable에서 조합합니다.
 */

import {computed} from "vue";
import {
  NAVIGATION_LOCK_SCOPES,
  useNavigationLockStore,
} from "@/stores/navigationLockStore";

export function useNavigationLock() {
  const navigationLockStore = useNavigationLockStore();

  const isGlobalLocked = computed(() =>
    navigationLockStore.isLocked(NAVIGATION_LOCK_SCOPES.global)
  );

  const isStreamingLocked = computed(() =>
    navigationLockStore.isLocked(NAVIGATION_LOCK_SCOPES.streaming)
  );

  const isChatHistoryLocked = computed(() =>
    navigationLockStore.isLocked(NAVIGATION_LOCK_SCOPES.chatHistory)
  );

  const isAnyLocked = computed(() => navigationLockStore.isAnyLocked);
  const lockedScopes = computed(() => navigationLockStore.lockedScopes);

  function acquireLock(scope, payload = {}) {
    return navigationLockStore.acquire(scope, payload);
  }

  function acquireLockIfFree(scope, payload = {}) {
    return navigationLockStore.acquireIfFree(scope, payload);
  }

  function releaseLock(scope, owner = null) {
    return navigationLockStore.release(scope, owner);
  }

  function releaseLocks(scopes = []) {
    navigationLockStore.releaseScopes(scopes);
  }

  function releaseAllLocks() {
    navigationLockStore.releaseAll();
  }

  function isLocked(scope) {
    return navigationLockStore.isLocked(scope);
  }

  function getLock(scope) {
    return navigationLockStore.getLock(scope);
  }

  return {
    NAVIGATION_LOCK_SCOPES,
    navigationLockStore,

    isGlobalLocked,
    isStreamingLocked,
    isChatHistoryLocked,
    isAnyLocked,
    lockedScopes,

    isLocked,
    getLock,
    acquireLock,
    acquireLockIfFree,
    releaseLock,
    releaseLocks,
    releaseAllLocks,
  };
}
