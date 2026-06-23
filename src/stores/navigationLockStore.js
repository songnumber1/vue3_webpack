/**
 * @file stores/navigationLockStore.js
 * @description 앱 전역 navigation/action lock 상태를 scope 단위로 관리합니다.
 *
 * 이 store는 UI/UX 정책을 판단하지 않고 lock의 원본 상태만 보관합니다.
 * 화면별 차단 정책은 각 Vue에서 useNavigationLock과 관련 store를 직접 조합합니다.
 */

import {defineStore} from "pinia";

/**
 * 앱 전체에서 공유하는 표준 lock scope입니다.
 * - global: 앱 전체 이동/액션을 일시 차단해야 하는 경우
 * - streaming: 답변 생성 중 이동/중복 액션 차단
 * - chatHistory: 대화방 목록에서 방을 가져오는 중 다른 방 클릭 차단
 */
export const NAVIGATION_LOCK_SCOPES = Object.freeze({
  global: "global",
  streaming: "streaming",
  chatHistory: "chat-history",
});

function normalizeScope(scope) {
  return String(scope || "").trim();
}

function createLockEntry(scope, payload = {}) {
  return {
    scope,
    owner: payload.owner || null,
    reason: payload.reason || "",
    createdAt: payload.createdAt || Date.now(),
    meta: {...(payload.meta || {})},
  };
}

/**
 * @description scope 기반 전역 lock 저장소입니다.
 * 실제 화면별 차단 여부는 이 store를 직접 조합하지 말고 영역별 lock composable에서 판단합니다.
 */
export const useNavigationLockStore = defineStore("navigationLock", {
  state: () => ({
    locks: {},
  }),
  getters: {
    isAnyLocked: (state) => Object.keys(state.locks).length > 0,
    isLocked: (state) => (scope) => {
      const normalizedScope = normalizeScope(scope);
      return Boolean(normalizedScope && state.locks[normalizedScope]);
    },
    getLock: (state) => (scope) => {
      const normalizedScope = normalizeScope(scope);
      return normalizedScope ? state.locks[normalizedScope] || null : null;
    },
    lockedScopes: (state) => Object.keys(state.locks),
  },
  actions: {
    /**
     * 지정 scope에 lock을 겁니다.
     * 같은 scope를 다시 acquire하면 최신 owner/reason으로 덮어씁니다.
     */
    acquire(scope, payload = {}) {
      const normalizedScope = normalizeScope(scope);
      if (!normalizedScope) return null;

      const lockEntry = createLockEntry(normalizedScope, payload);
      this.locks = {
        ...this.locks,
        [normalizedScope]: lockEntry,
      };
      return lockEntry;
    },

    /**
     * 지정 scope의 lock을 해제합니다.
     * owner가 전달되면 현재 lock owner와 일치할 때만 해제하여 늦은 finally가 새 lock을 풀지 못하게 방어합니다.
     */
    release(scope, owner = null) {
      const normalizedScope = normalizeScope(scope);
      if (!normalizedScope || !this.locks[normalizedScope]) return false;

      const currentLock = this.locks[normalizedScope];
      if (owner && currentLock.owner && currentLock.owner !== owner) {
        return false;
      }

      const nextLocks = {...this.locks};
      delete nextLocks[normalizedScope];
      this.locks = nextLocks;
      return true;
    },

    /**
     * 지정 scope에 lock이 없을 때만 acquire합니다.
     */
    acquireIfFree(scope, payload = {}) {
      const normalizedScope = normalizeScope(scope);
      if (!normalizedScope || this.isLocked(normalizedScope)) return null;
      return this.acquire(normalizedScope, payload);
    },

    /**
     * 특정 scope 목록만 해제합니다.
     */
    releaseScopes(scopes = []) {
      scopes.forEach((scope) => this.release(scope));
    },

    /**
     * 모든 lock을 해제합니다.
     * 로그아웃/앱 초기화 같은 전역 reset 시점에서만 사용합니다.
     */
    releaseAll() {
      this.locks = {};
    },
  },
});
