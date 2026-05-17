const METHOD_MAP = Object.freeze({
  OPEN_EXTERNAL_BROWSER: 'openExternalBrowser',
  OPEN_FILE_PICKER: 'openFilePicker',
  GET_PUSH_TOKEN: 'getPushToken',
  GET_APP_VERSION: 'getAppVersion',
  COPY_CLIPBOARD: 'copyClipboard',
  SHARE: 'share',
  CHECK_NETWORK: 'checkNetwork',
  GET_STORAGE: 'getStorage',
  SET_STORAGE: 'setStorage',
  REMOVE_STORAGE: 'removeStorage',
  CANCEL_REQUEST: 'cancelRequest',
  SET_BACK_HANDLER: 'setBackHandler',
  SHOW_TOAST: 'showToast',
  GET_DEVICE_INFO: 'getDeviceInfo',
  WRITE_LOG: 'writeLog',
  CLOSE_APP: 'closeApp',
});

export function getAndroidBridgeMethodName(type) {
  return METHOD_MAP[type];
}

export function getAndroidBridge() {
  return typeof window === 'undefined' ? null : window.AndroidBridge || null;
}

export function hasPostMessageBridge() {
  return typeof getAndroidBridge()?.postMessage === 'function';
}

export function hasDirectAndroidBridge(type) {
  const methodName = getAndroidBridgeMethodName(type);
  const bridge = getAndroidBridge();
  return Boolean(bridge && methodName && typeof bridge[methodName] === 'function');
}

export function callDirectAndroidBridge(type, payload) {
  const methodName = getAndroidBridgeMethodName(type);
  const bridge = getAndroidBridge();
  if (!bridge || !methodName || typeof bridge[methodName] !== 'function') return null;
  const raw = bridge[methodName](JSON.stringify(payload));
  return Promise.resolve(raw);
}

export function postAndroidBridgeMessage(type, payload) {
  const bridge = getAndroidBridge();
  if (!bridge || typeof bridge.postMessage !== 'function') return null;
  return bridge.postMessage(
    JSON.stringify({requestId: payload.requestId, type, payload})
  );
}
