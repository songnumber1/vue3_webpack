import {isNativeApp} from "@/core/config";
import {callNative} from "@/bridge/bridgeClient";
import {logWarn} from "@/utils/logger";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description getLocalStorage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getLocalStorage() {
  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    const testKey = "__storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    // 계산된 결과를 호출부로 반환합니다.
    return storage;
  } catch {
    // 계산된 결과를 호출부로 반환합니다.
    return null;
  }
}

const memoryStorage = new Map();

/**
 * @description getFallback 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} key - key 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getFallback(key) {
  // 계산된 결과를 호출부로 반환합니다.
  return memoryStorage.has(key) ? memoryStorage.get(key) : null;
}

/**
 * @description setFallback 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} key - key 입력값입니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function setFallback(key, value) {
  memoryStorage.set(key, String(value));
}

/**
 * @description removeFallback 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} key - key 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function removeFallback(key) {
  memoryStorage.delete(key);
}

/**
 * @description createRequest 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createRequest(payload = {}) {
  // 계산된 결과를 호출부로 반환합니다.
  return {
    requestId: `storage_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    requestDate: new Date().toISOString(),
    ...payload,
  };
}

/**
 * @description parseEnvelope 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} raw - raw 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function parseEnvelope(raw) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!raw) return null;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof raw === "object") return raw;
  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    // 계산된 결과를 호출부로 반환합니다.
    return JSON.parse(raw);
  } catch (error) {
    logWarn("[storage] invalid native response", error);
    // 계산된 결과를 호출부로 반환합니다.
    return null;
  }
}

/**
 * @description callDirectStorage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} bridge - bridge 입력값입니다.
 * @param {*} methodName - methodName 입력값입니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function callDirectStorage(bridge, methodName, payload) {
  const method = bridge?.[methodName];
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof method !== "function") return null;
  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    // 계산된 결과를 호출부로 반환합니다.
    return parseEnvelope(
      method.call(bridge, JSON.stringify(createRequest(payload)))
    );
  } catch (error) {
    logWarn(`[storage] AndroidBridge.${methodName} failed`, error);
    // 계산된 결과를 호출부로 반환합니다.
    return null;
  }
}

/**
 * @description createLocalStorageAdapter 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createLocalStorageAdapter() {
  const local = getLocalStorage();
  // 계산된 결과를 호출부로 반환합니다.
  return {
    get: (key) => local?.getItem(key) ?? getFallback(key),
    set: (key, value) => {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (local) local.setItem(key, String(value));
      setFallback(key, value);
    },
    remove: (key) => {
      local?.removeItem(key);
      removeFallback(key);
    },
  };
}

/**
 * @description resolveStorage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @param {*} bridge - bridge 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function resolveStorage(appInfo, bridge) {
  const localStorageAdapter = createLocalStorageAdapter();

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isNativeApp(appInfo)) {
    // 계산된 결과를 호출부로 반환합니다.
    return {
      get(key) {
        const response = callDirectStorage(bridge, "getStorage", {key});
        // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
        if (response?.isSuccess)
          // 계산된 결과를 호출부로 반환합니다.
          return response.data?.value ?? localStorageAdapter.get(key);
        // 계산된 결과를 호출부로 반환합니다.
        return localStorageAdapter.get(key);
      },
      set(key, value) {
        const response = callDirectStorage(bridge, "setStorage", {
          key,
          value: String(value),
        });
        // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
        if (!response?.isSuccess)
          logWarn(
            "[storage] native setStorage fallback used",
            response?.message
          );
        localStorageAdapter.set(key, value);
      },
      remove(key) {
        const response = callDirectStorage(bridge, "removeStorage", {key});
        // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
        if (!response?.isSuccess && response)
          logWarn(
            "[storage] native removeStorage fallback used",
            response?.message
          );
        localStorageAdapter.remove(key);
      },
      async getAsync(key) {
        // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
        try {
          const response = await callNative("GET_STORAGE", {key});
          // 계산된 결과를 호출부로 반환합니다.
          return response?.data?.value ?? localStorageAdapter.get(key);
        } catch (error) {
          logWarn("[storage] native getAsync fallback used", error);
          // 계산된 결과를 호출부로 반환합니다.
          return localStorageAdapter.get(key);
        }
      },
      async setAsync(key, value) {
        // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
        try {
          await callNative("SET_STORAGE", {key, value: String(value)});
        } catch (error) {
          logWarn("[storage] native setAsync fallback used", error);
        }
        localStorageAdapter.set(key, value);
      },
      async removeAsync(key) {
        // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
        try {
          await callNative("REMOVE_STORAGE", {key});
        } catch (error) {
          logWarn("[storage] native removeAsync fallback used", error);
        }
        localStorageAdapter.remove(key);
      },
    };
  }

  // 계산된 결과를 호출부로 반환합니다.
  return {
    ...localStorageAdapter,
    getAsync: (key) => Promise.resolve(localStorageAdapter.get(key)),
    setAsync: (key, value) => {
      localStorageAdapter.set(key, value);
      // 계산된 결과를 호출부로 반환합니다.
      return Promise.resolve();
    },
    removeAsync: (key) => {
      localStorageAdapter.remove(key);
      // 계산된 결과를 호출부로 반환합니다.
      return Promise.resolve();
    },
  };
}
