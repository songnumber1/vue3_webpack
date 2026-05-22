import {callNative} from "@/bridge/bridgeClient";
import {usePlatformStore} from "@/stores/platformStore";
import {logInfo} from "@/utils/logger";
import {copyText as copyWebText} from "@/utils/clipboard";
import {i18n} from "@/i18n";
import {
  APP_CLIPBOARD_COPIED_EVENT,
  APP_TOAST_REQUESTED_EVENT,
  dispatchAppFeedbackEvent,
  getFeedbackChannel as resolveFeedbackChannel,
} from "@/utils/appFeedback";

function getFeedbackChannel() {
  return resolveFeedbackChannel(getStore().info || {});
}

function dispatchFeedbackEvent(name, detail) {
  dispatchAppFeedbackEvent(name, detail, getStore().info || {});
}

function notifyClipboardCopied(message, toastMessage = message) {
  dispatchFeedbackEvent(APP_CLIPBOARD_COPIED_EVENT, {message, toastMessage});
}

function notifyToastRequested(message, options = {}) {
  dispatchFeedbackEvent(APP_TOAST_REQUESTED_EVENT, {
    message,
    toastMessage: message,
    title: options.title || t("toastNote.title"),
  });
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
  const toastMessage = t("clipboardNote.toastMessage");

  if (isAndroidApp()) {
    const response = await callNative("COPY_CLIPBOARD", {
      text,
      message: successMessage,
    });

    if (response?.isSuccess !== false) {
      await showToastByPlatform(toastMessage, {
        title: t("clipboardNote.title"),
      });
    }

    return response;
  }

  const copied = await copyWebText(text);
  const message = copied ? successMessage : t("clipboardNote.fail");

  if (copied) notifyClipboardCopied(message, toastMessage);

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
    return webSuccess({token: ""}, t("platformBridge.browserFcmUnavailable"));
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
export async function showToastByPlatform(message, options = {}) {
  const normalizedMessage = String(message || "").trim();

  if (!normalizedMessage) {
    return webSuccess({shown: false, reason: "empty-message"});
  }

  if (isAndroidApp()) {
    return callNative("SHOW_TOAST", {message: normalizedMessage});
  }

  notifyToastRequested(normalizedMessage, options);
  logInfo("[toast]", normalizedMessage);

  return webSuccess({shown: true, channel: getFeedbackChannel()});
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
