import { isNativeApp } from '@/core/config'

function getLocalStorage() {
  try {
    if (typeof window === 'undefined') return null
    const storage = window.localStorage
    const testKey = '__storage_test__'
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return storage
  } catch {
    return null
  }
}

const memoryStorage = new Map()

function getFallback(key) {
  return memoryStorage.has(key) ? memoryStorage.get(key) : null
}

function setFallback(key, value) {
  memoryStorage.set(key, String(value))
}

function removeFallback(key) {
  memoryStorage.delete(key)
}

export function resolveStorage(appInfo, bridge) {
  const local = getLocalStorage()

  const localStorageAdapter = {
    get: (key) => local?.getItem(key) ?? getFallback(key),
    set: (key, value) => {
      if (local) local.setItem(key, value)
      setFallback(key, value)
    },
    remove: (key) => {
      local?.removeItem(key)
      removeFallback(key)
    }
  }

  if (isNativeApp(appInfo)) {
    return {
      get(key) {
        return bridge?.getStorage?.(key) ?? localStorageAdapter.get(key)
      },
      set(key, value) {
        bridge?.setStorage?.(key, value)
        localStorageAdapter.set(key, value)
      },
      remove(key) {
        localStorageAdapter.remove(key)
      }
    }
  }

  return localStorageAdapter
}
