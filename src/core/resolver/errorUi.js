import { isNativeApp } from '@/core/config'

export function resolveErrorUI(appInfo, bridge) {
  if (isNativeApp(appInfo)) {
    return {
      notify(message) {
        bridge?.toast?.(message)
      }
    }
  }

  return {
    notify(message) {
      console.warn(message)
    }
  }
}
