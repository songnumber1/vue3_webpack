export function resolveErrorUI(platform, bridge) {
  if (platform === 'android') {
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
