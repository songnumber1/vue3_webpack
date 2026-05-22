import {isNativeApp} from "@/core/config";
import {callNative} from "@/platform/bridge/web/bridgeClient";
import {logWarn} from "@/utils/logger";

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
function getFallback(key) {
  return memoryStorage.has(key) ? memoryStorage.get(key) : null;
}
function setFallback(key, value) {
  memoryStorage.set(key, String(value));
}
function removeFallback(key) {
  memoryStorage.delete(key);
}
function createRequest(payload = {}) {
  return {
    requestId: `storage_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    requestDate: new Date().toISOString(),
    ...payload,
  };
}
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
