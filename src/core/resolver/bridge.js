const noopBridge = {
  getToken: () => null,
  getStorage: () => null,
  setStorage: () => {},
  toast: (message) => window.alert(message),
  requestPermission: () => Promise.resolve(false),
  uploadFile: () => Promise.reject(new Error('Native upload is not available.'))
}

export function resolveBridge(platform) {
  if (platform === 'android' && window.AndroidBridge) return window.AndroidBridge
  return noopBridge
}
