import {callNative} from "@/platform/bridge/web/bridgeClient";
import {usePlatformStore} from "@/stores/platformStore";
import {logInfo} from "@/utils/logger";
import {copyText as copyWebText} from "@/platform/system/clipboard";
import {i18n} from "@/i18n";
import {logPlatformDebug} from "@/platform/platformDebug";
import {
  APP_CLIPBOARD_COPIED_EVENT,
  APP_TOAST_REQUESTED_EVENT,
  dispatchAppFeedbackEvent,
  getFeedbackChannel as resolveFeedbackChannel,
} from "@/utils/appFeedback";

/**
 * Android WebView와 일반 브라우저에서 동일한 API를 호출할 수 있게 하는 platform facade입니다.
 *
 * 각 exported 함수는 먼저 현재 런타임이 Android 앱인지 확인하고,
 * 앱이면 window.AndroidBridge 기반 callNative를 사용합니다.
 * 브라우저면 webSuccess 형태의 동일한 응답 구조를 만들어 상위 UI가 분기 없이 처리하게 합니다.
 */
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
/**
 * 브라우저 fallback도 네이티브 응답과 동일한 형태로 맞춥니다.
 * 이 구조 덕분에 호출부는 Android/Web을 따로 분기하지 않아도 됩니다.
 */
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
/**
 * 클립보드 복사 요청을 현재 플랫폼에 맞게 처리합니다.
 * Android 앱에서는 네이티브 브릿지를 사용하고, 웹에서는 Clipboard API fallback 후
 * PC note/mobile toast 이벤트를 발생시킵니다.
 */
export async function copyClipboardByPlatform(text) {
  logPlatformDebug("feedback.clipboard.route", {
    isAndroidApp: isAndroidApp(),
    channel: getFeedbackChannel(),
    platform: getStore().info?.env,
    browser: getStore().info?.browser,
    isPlatformForced: getStore().info?.isPlatformForced,
  });

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
/**
 * 외부 브라우저 열기는 WebView에서 native 위임이 필요하고, 일반 웹에서는 window.open fallback을 사용합니다.
 */
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
/**
 * 공유 기능은 Android native share sheet와 Web Share API를 동일한 호출 형태로 감쌉니다.
 */
export async function shareByPlatform(data) {
  if (isAndroidApp()) return callNative("SHARE", {data});
  if (navigator.share) {
    await navigator.share(data);

    return webSuccess({shared: true});
  }
  throw new Error(t("platformBridge.shareUnsupported"));
}
/**
 * 네트워크 상태 확인은 Android native 값과 browser navigator.onLine 값을 같은 응답 형태로 정규화합니다.
 */
export async function checkNetworkByPlatform() {
  if (isAndroidApp()) return callNative("CHECK_NETWORK", {});

  return webSuccess({online: navigator.onLine, type: "browser"});
}
/**
 * 스토리지 API는 Android native storage와 browser localStorage를 동일한 key/value 인터페이스로 맞춥니다.
 */
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
/**
 * 플랫폼별 toast 요청 facade입니다.
 * Android 앱에서는 native toast를 호출하고, 브라우저에서는 앱 내부 feedback event로 전달합니다.
 */
export async function showToastByPlatform(message, options = {}) {
  logPlatformDebug("feedback.toast.route", {
    isAndroidApp: isAndroidApp(),
    channel: getFeedbackChannel(),
    platform: getStore().info?.env,
    browser: getStore().info?.browser,
    isPlatformForced: getStore().info?.isPlatformForced,
  });

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

/**
 * Android 앱이면 네이티브 기기 정보를 요청하고, 웹이면 platformStore의 탐지 정보를 반환합니다.
 */
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
