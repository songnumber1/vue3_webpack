/**
 * @file core/resolver/storage.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {isNativeApp} from "@/core/config";
import {callNative} from "@/platform/bridge/web/bridgeClient";
import {logWarn} from "@/utils/logger";

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getLocalStorage() {
  try {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    const testKey = "__storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);

    return storage;
  } catch {
    return null;
  }
}

const memoryStorage = new Map();
/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getFallback(key) {
  return memoryStorage.has(key) ? memoryStorage.get(key) : null;
}
/**
 * store, DOM CSS 변수 또는 reactive 상태에 값을 반영합니다.
 */
function setFallback(key, value) {
  memoryStorage.set(key, String(value));
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function removeFallback(key) {
  memoryStorage.delete(key);
}
/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createRequest(payload = {}) {
  return {
    requestId: `storage_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    requestDate: new Date().toISOString(),
    ...payload,
  };
}
/**
 * 문자열 또는 stream buffer를 의미 있는 frame/object로 파싱합니다.
 */
function parseEnvelope(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch (error) {
    logWarn("[storage] invalid native response", error);

    return null;
  }
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function callDirectStorage(bridge, methodName, payload) {
  const method = bridge?.[methodName];
  if (typeof method !== "function") return null;
  try {
    return parseEnvelope(
      method.call(bridge, JSON.stringify(createRequest(payload)))
    );
  } catch (error) {
    logWarn(`[storage] AndroidBridge.${methodName} failed`, error);

    return null;
  }
}
/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createLocalStorageAdapter() {
  const local = getLocalStorage();

  return {
    get: (key) => local?.getItem(key) ?? getFallback(key),
    set: (key, value) => {
      if (local) local.setItem(key, String(value));
      setFallback(key, value);
    },
    remove: (key) => {
      local?.removeItem(key);
      removeFallback(key);
    },
  };
}
export function resolveStorage(appInfo, bridge) {
  const localStorageAdapter = createLocalStorageAdapter();

  if (isNativeApp(appInfo)) {
    return {
      get(key) {
        const response = callDirectStorage(bridge, "getStorage", {key});
        if (response?.isSuccess)
          return response.data?.value ?? localStorageAdapter.get(key);

        return localStorageAdapter.get(key);
      },
      set(key, value) {
        const response = callDirectStorage(bridge, "setStorage", {
          key,
          value: String(value),
        });
        if (!response?.isSuccess)
          logWarn(
            "[storage] native setStorage fallback used",
            response?.message
          );
        localStorageAdapter.set(key, value);
      },
      remove(key) {
        const response = callDirectStorage(bridge, "removeStorage", {key});
        if (!response?.isSuccess && response)
          logWarn(
            "[storage] native removeStorage fallback used",
            response?.message
          );
        localStorageAdapter.remove(key);
      },
      async getAsync(key) {
        try {
          const response = await callNative("GET_STORAGE", {key});

          return response?.data?.value ?? localStorageAdapter.get(key);
        } catch (error) {
          logWarn("[storage] native getAsync fallback used", error);

          return localStorageAdapter.get(key);
        }
      },
      async setAsync(key, value) {
        try {
          await callNative("SET_STORAGE", {key, value: String(value)});
        } catch (error) {
          logWarn("[storage] native setAsync fallback used", error);
        }
        localStorageAdapter.set(key, value);
      },
      async removeAsync(key) {
        try {
          await callNative("REMOVE_STORAGE", {key});
        } catch (error) {
          logWarn("[storage] native removeAsync fallback used", error);
        }
        localStorageAdapter.remove(key);
      },
    };
  }

  return {
    ...localStorageAdapter,
    getAsync: (key) => Promise.resolve(localStorageAdapter.get(key)),
    setAsync: (key, value) => {
      localStorageAdapter.set(key, value);

      return Promise.resolve();
    },
    removeAsync: (key) => {
      localStorageAdapter.remove(key);

      return Promise.resolve();
    },
  };
}
