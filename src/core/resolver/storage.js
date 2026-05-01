export function resolveStorage(platform, bridge) {
  if (platform === 'android') {
    return {
      get(key) {
        return bridge?.getStorage?.(key) ?? localStorage.getItem(key)
      },
      set(key, value) {
        bridge?.setStorage?.(key, value)
        localStorage.setItem(key, value)
      },
      remove(key) {
        localStorage.removeItem(key)
      }
    }
  }

  return {
    get: (key) => localStorage.getItem(key),
    set: (key, value) => localStorage.setItem(key, value),
    remove: (key) => localStorage.removeItem(key)
  }
}
