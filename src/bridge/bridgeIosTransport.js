export function getIosBridgeHandler(name = "AppBridge") {
  return window.webkit?.messageHandlers?.[name] || null;
}

export function hasIosBridgeHandler(name = "AppBridge") {
  return Boolean(getIosBridgeHandler(name)?.postMessage);
}
