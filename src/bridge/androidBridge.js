export function getAndroidBridge() {
  if (typeof window === 'undefined') return null;
  if (window.AndroidBridge) return window.AndroidBridge;
  if (window.Android) return window.Android;
  if (window.ReactNativeWebView) return window.ReactNativeWebView;
  return null;
}

export function postBridgeMessage(type, payload) {
  const bridge = getAndroidBridge();
  const message = JSON.stringify({ type: type, payload: payload || {} });

  if (!bridge) {
    console.info('[Bridge Fallback]', message);
    return false;
  }

  if (typeof bridge.postMessage === 'function') {
    bridge.postMessage(message);
    return true;
  }

  if (typeof bridge.sendMessage === 'function') {
    bridge.sendMessage(message);
    return true;
  }

  return false;
}
