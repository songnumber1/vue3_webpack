import {isAndroidApp} from "@/core/config";
import {logWarn} from "@/utils/logger";

const noopBridge = {
  getToken: () => null,
  getStorage: () => null,
  setStorage: () => {},
  toast: (message) => {
    logWarn("[native-toast:fallback]", message);
  },
  requestPermission: () => Promise.resolve(false),
  uploadFile: () =>
    Promise.reject(new Error("Native upload is not available.")),
};
export function resolveBridge(appInfo) {
  if (isAndroidApp(appInfo) && window.AndroidBridge) return window.AndroidBridge;

  return noopBridge;
}
