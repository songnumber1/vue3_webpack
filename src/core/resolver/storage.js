/**
 * @file storage.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {isNativeApp} from "@/core/config";
import {callNative} from "@/bridge/bridgeClient";

/**
 * getLocalStorage 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
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
 * getFallback 처리 함수입니다.
 * @param {*} key 함수 실행에 필요한 입력값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getFallback(key) {
  return memoryStorage.has(key) ? memoryStorage.get(key) : null;
}

/**
 * setFallback 처리 함수입니다.
 * @param {*} key 함수 실행에 필요한 입력값입니다.
 * @param {*} value 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function setFallback(key, value) {
  memoryStorage.set(key, String(value));
}

/**
 * removeFallback 처리 함수입니다.
 * @param {*} key 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function removeFallback(key) {
  memoryStorage.delete(key);
}

/**
 * createRequest 처리 함수입니다.
 * @param {*} payload 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function createRequest(payload = {}) {
  return {
    requestId: `storage_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    requestDate: new Date().toISOString(),
    ...payload,
  };
}

/**
 * parseEnvelope 처리 함수입니다.
 * @param {*} raw 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function parseEnvelope(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("[storage] invalid native response", error);
    return null;
  }
}

/**
 * callDirectStorage 처리 함수입니다.
 * @param {*} bridge 함수 실행에 필요한 입력값입니다.
 * @param {*} methodName 함수 실행에 필요한 입력값입니다.
 * @param {*} payload 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function callDirectStorage(bridge, methodName, payload) {
  const method = bridge?.[methodName];
  if (typeof method !== "function") return null;
  try {
    return parseEnvelope(
      method.call(bridge, JSON.stringify(createRequest(payload)))
    );
  } catch (error) {
    console.warn(`[storage] AndroidBridge.${methodName} failed`, error);
    return null;
  }
}

/**
 * createLocalStorageAdapter 처리 함수입니다.
 * @returns {void}
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
          console.warn(
            "[storage] native setStorage fallback used",
            response?.message
          );
        localStorageAdapter.set(key, value);
      },
      remove(key) {
        const response = callDirectStorage(bridge, "removeStorage", {key});
        if (!response?.isSuccess && response)
          console.warn(
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
          console.warn("[storage] native getAsync fallback used", error);
          return localStorageAdapter.get(key);
        }
      },
      async setAsync(key, value) {
        try {
          await callNative("SET_STORAGE", {key, value: String(value)});
        } catch (error) {
          console.warn("[storage] native setAsync fallback used", error);
        }
        localStorageAdapter.set(key, value);
      },
      async removeAsync(key) {
        try {
          await callNative("REMOVE_STORAGE", {key});
        } catch (error) {
          console.warn("[storage] native removeAsync fallback used", error);
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
