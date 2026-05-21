import {callNative} from "@/bridge/bridgeClient";
import {usePlatformStore} from "@/stores/platformStore";
import {logInfo} from "@/utils/logger";
import {copyText as copyWebText} from "@/utils/clipboard";
import {i18n} from "@/i18n";

function notifyDesktopWebClipboardCopied(message) {
  if (typeof window === "undefined") return;
  const info = getStore().info || {};
  if (
    info.isNativeRuntime ||
    info.isNativeApp ||
    info.isAndroidApp ||
    info.isIosApp ||
    info.isMobileBrowser
  ) {
    return;
  }
  window.dispatchEvent(
    new CustomEvent("app:clipboard-copied", {
      detail: {message, channel: "desktop-note"},
    })
  );
}

function t(key, params) {
  return i18n.global.t(key, params);
}

function getStore() {
  return usePlatformStore();
}
function isAndroidApp() {
  return getStore().info.isAndroidApp;
}
function webSuccess(data = {}, message = t("platformBridge.browserHandled")) {
  return {
    requestId: `web_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    requestDate: new Date().toISOString(),
    responseDate: new Date().toISOString(),
    isSuccess: true,
    code: "SUCCESS",
    data,
    message,
    meta: {runtime: "browser"},
  };
}
export async function copyClipboardByPlatform(text) {
  const successMessage = t("clipboardNote.message");
  if (isAndroidApp()) {
    return callNative("COPY_CLIPBOARD", {
      text,
      message: successMessage,
      toastMessage: successMessage,
    });
  }
  const copied = await copyWebText(text);

  const message = copied ? successMessage : t("clipboardNote.fail");
  if (copied) notifyDesktopWebClipboardCopied(message);

  return webSuccess({copied}, message);
}
export async function openExternalBrowser(url) {
  if (isAndroidApp()) return callNative("OPEN_EXTERNAL_BROWSER", {url});
  window.open(url, "_blank", "noopener,noreferrer");

  return webSuccess({opened: true});
}
export async function openNativeFilePicker(options = {}) {
  if (isAndroidApp()) return callNative("OPEN_FILE_PICKER", {options});

  return webSuccess(
    {opened: false, reason: "browser-file-input-required"},
    t("platformBridge.browserFileInputRequired")
  );
}
export async function getPushToken() {
  if (!isAndroidApp())
    return webSuccess(
      {token: ""},
      t("platformBridge.browserFcmUnavailable")
    );
  const res = await callNative("GET_PUSH_TOKEN", {});
  getStore().setPushToken(res.data?.token);

  return res;
}
export async function getAppVersion() {
  if (!isAndroidApp()) return webSuccess(getStore().info);
  const res = await callNative("GET_APP_VERSION", {});
  getStore().setAppVersionInfo(res.data);

  return res;
}
export async function shareByPlatform(data) {
  if (isAndroidApp()) return callNative("SHARE", {data});
  if (navigator.share) {
    await navigator.share(data);

    return webSuccess({shared: true});
  }
  throw new Error(t("platformBridge.shareUnsupported"));
}
export async function checkNetworkByPlatform() {
  if (isAndroidApp()) return callNative("CHECK_NETWORK", {});

  return webSuccess({online: navigator.onLine, type: "browser"});
}
export async function getNativeStorage(key) {
  if (isAndroidApp()) return callNative("GET_STORAGE", {key});
  const value = window.localStorage?.getItem(key) ?? null;

  return webSuccess({key, value});
}
export async function setNativeStorage(key, value) {
  if (isAndroidApp()) return callNative("SET_STORAGE", {key, value});
  window.localStorage?.setItem(key, String(value));

  return webSuccess({key, saved: true});
}
export async function removeNativeStorage(key) {
  if (isAndroidApp()) return callNative("REMOVE_STORAGE", {key});
  window.localStorage?.removeItem(key);

  return webSuccess({key, removed: true});
}
export async function cancelNativeRequest(id) {
  return isAndroidApp()
    ? callNative("CANCEL_REQUEST", {id})
    : webSuccess({id, cancelled: true});
}
export async function setBackHandler(enable) {
  return isAndroidApp()
    ? callNative("SET_BACK_HANDLER", {enable})
    : webSuccess({enabled: false});
}
export async function showNativeToast(message) {
  if (isAndroidApp()) return callNative("SHOW_TOAST", {message});
  logInfo("[toast]", message);

  return webSuccess({shown: true});
}
export async function getDeviceInfo() {
  return isAndroidApp()
    ? callNative("GET_DEVICE_INFO", {})
    : webSuccess(getStore().info);
}
export async function writeNativeLog(data) {
  if (isAndroidApp()) return callNative("WRITE_LOG", {data});
  logInfo("[native-log]", data);

  return webSuccess({written: true});
}
export async function closeApp() {
  if (isAndroidApp()) return callNative("CLOSE_APP", {});
  window.close();

  return webSuccess({closed: false});
}
