export function resolvePermission(platform, bridge) {
  return {
    async request(name) {
      if (platform === 'android') return bridge?.requestPermission?.(name)
      return true
    }
  }
}
