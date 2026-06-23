/**
 * @file platform/bridge/platformBridge.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {callNative} from "@/platform/bridge/native/bridgeNativeRuntime";
import {usePlatformStore} from "@/stores/platformStore";
import {logInfo, logWarn} from "@/utils/logger";
import {copyText as copyWebText} from "@/platform/system/clipboard";
import {i18n} from "@/i18n/appI18n";
import {logPlatformDebug} from "@/platform/platformDebug";
import {createId} from "@/utils/id";
import {
  APP_CLIPBOARD_COPIED_EVENT,
  APP_TOAST_REQUESTED_EVENT,
  dispatchAppFeedbackEvent,
  getFeedbackChannel as resolveFeedbackChannel,
} from "@/utils/appFeedback";

/**
 * [Android WebView Bridge / Web fallback]
 * AndroidBridge가 존재하면 네이티브 기능을 호출하고, 일반 웹에서는 가능한 브라우저 API로 fallback합니다.
 * 같은 기능이라도 WebView와 모바일 브라우저에서 권한/동작 방식이 다르므로 이 파일에서 platform 차이를 흡수합니다.
 */

/**
 * Android WebView와 일반 브라우저에서 동일한 API를 호출할 수 있게 하는 platform facade입니다.
 *
 * 각 exported 함수는 먼저 현재 런타임이 Android 앱인지 확인하고,
 * 앱이면 window.AndroidBridge 기반 callNative를 사용합니다.
 * 브라우저면 webSuccess 형태의 동일한 응답 구조를 만들어 상위 UI가 분기 없이 처리하게 합니다.
 */
/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getFeedbackChannel() {
  return resolveFeedbackChannel(getStore().info || {});
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function dispatchFeedbackEvent(name, detail) {
  dispatchAppFeedbackEvent(name, detail, getStore().info || {});
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function notifyClipboardCopied(message, toastMessage = message) {
  dispatchFeedbackEvent(APP_CLIPBOARD_COPIED_EVENT, {message, toastMessage});
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function notifyToastRequested(message, options = {}) {
  dispatchFeedbackEvent(APP_TOAST_REQUESTED_EVENT, {
    message,
    toastMessage: message,
    title: options.title || t("toastNote.title"),
  });
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function t(key, params) {
  return i18n.global.t(key, params);
}

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getStore() {
  return usePlatformStore();
}
/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function isAndroidApp() {
  return getStore().info.isAndroidApp;
}

async function callNativeWithLogging(type, payload = {}) {
  try {
    return await callNative(type, payload);
  } catch (error) {
    logWarn(`[platformBridge] native bridge failed: ${type}`, error);
    throw error;
  }
}

/**
 * Android/Web 분기만 공통화합니다.
 * 기존 named export의 payload 정규화, toast/note, store side effect는 각 함수에 그대로 둡니다.
 */
async function executeBridgeApi(type, payload = {}, options = {}) {
  const {browserFallback, afterNative} = options;

  if (isAndroidApp()) {
    const response = await callNativeWithLogging(type, payload);

    if (typeof afterNative === "function") {
      await afterNative(response);
    }

    return response;
  }

  if (typeof browserFallback === "function") {
    return browserFallback(payload);
  }

  return webSuccess({handled: false, reason: "no-browser-fallback"});
}

function createBrowserSuccessFallback(data = {}, message) {
  return () => webSuccess(data, message);
}

/**
 * 브라우저 fallback도 네이티브 응답과 동일한 형태로 맞춥니다.
 * 이 구조 덕분에 호출부는 Android/Web을 따로 분기하지 않아도 됩니다.
 */
function webSuccess(data = {}, message = t("platformBridge.browserHandled")) {
  return {
    requestId: createId(),
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

  return executeBridgeApi(
    "COPY_CLIPBOARD",
    {text, message: successMessage},
    {
      browserFallback: async () => {
        try {
          const copied = await copyWebText(text);
          const message = copied ? successMessage : t("clipboardNote.fail");

          if (copied) notifyClipboardCopied(message, toastMessage);

          return webSuccess({copied}, message);
        } catch (error) {
          logWarn("[platformBridge] browser clipboard failed:", error);
          return webSuccess({copied: false}, t("clipboardNote.fail"));
        }
      },
      afterNative: async (response) => {
        if (response?.isSuccess !== false) {
          await showToastByPlatform(toastMessage, {
            title: t("clipboardNote.title"),
          });
        }
      },
    }
  );
}
/**
 * 외부 브라우저 열기는 WebView에서 native 위임이 필요하고, 일반 웹에서는 window.open fallback을 사용합니다.
 */
export async function openExternalBrowser(url) {
  return executeBridgeApi(
    "OPEN_EXTERNAL_BROWSER",
    {url},
    {
      browserFallback: () => {
        try {
          window.open(url, "_blank", "noopener,noreferrer");
          return webSuccess({opened: true});
        } catch (error) {
          logWarn("[platformBridge] browser external open failed:", error);
          return webSuccess({opened: false});
        }
      },
    }
  );
}
export async function openNativeFilePicker(options = {}) {
  return executeBridgeApi(
    "OPEN_FILE_PICKER",
    {options},
    {
      browserFallback: createBrowserSuccessFallback(
        {opened: false, reason: "browser-file-input-required"},
        t("platformBridge.browserFileInputRequired")
      ),
    }
  );
}
export async function getPushToken() {
  return executeBridgeApi(
    "GET_PUSH_TOKEN",
    {},
    {
      browserFallback: createBrowserSuccessFallback(
        {token: ""},
        t("platformBridge.browserFcmUnavailable")
      ),
      afterNative: (res) => {
        getStore().setPushToken(res.data?.token);
      },
    }
  );
}
export async function getAppVersion() {
  return executeBridgeApi(
    "GET_APP_VERSION",
    {},
    {
      browserFallback: () => webSuccess(getStore().info),
      afterNative: (res) => {
        getStore().setAppVersionInfo(res.data);
      },
    }
  );
}
/**
 * 공유 기능은 Android native share sheet와 Web Share API를 동일한 호출 형태로 감쌉니다.
 */
export async function shareByPlatform(data) {
  return executeBridgeApi(
    "SHARE",
    {data},
    {
      browserFallback: async () => {
        if (navigator.share) {
          await navigator.share(data);

          return webSuccess({shared: true});
        }
        throw new Error(t("platformBridge.shareUnsupported"));
      },
    }
  );
}
/**
 * 네트워크 상태 확인은 Android native 값과 browser navigator.onLine 값을 같은 응답 형태로 정규화합니다.
 */
export async function checkNetworkByPlatform() {
  return executeBridgeApi(
    "CHECK_NETWORK",
    {},
    {
      browserFallback: () =>
        webSuccess({online: navigator.onLine, type: "browser"}),
    }
  );
}
/**
 * 스토리지 API는 Android native storage와 browser localStorage를 동일한 key/value 인터페이스로 맞춥니다.
 */
export async function getNativeStorage(key) {
  return executeBridgeApi(
    "GET_STORAGE",
    {key},
    {
      browserFallback: () => {
        const value = window.localStorage?.getItem(key) ?? null;

        return webSuccess({key, value});
      },
    }
  );
}
export async function setNativeStorage(key, value) {
  return executeBridgeApi(
    "SET_STORAGE",
    {key, value},
    {
      browserFallback: () => {
        window.localStorage?.setItem(key, String(value));

        return webSuccess({key, saved: true});
      },
    }
  );
}
export async function removeNativeStorage(key) {
  return executeBridgeApi(
    "REMOVE_STORAGE",
    {key},
    {
      browserFallback: () => {
        window.localStorage?.removeItem(key);

        return webSuccess({key, removed: true});
      },
    }
  );
}
export async function cancelNativeRequest(id) {
  return executeBridgeApi(
    "CANCEL_REQUEST",
    {id},
    {
      browserFallback: createBrowserSuccessFallback({id, cancelled: true}),
    }
  );
}
export async function setBackHandler(enable) {
  return executeBridgeApi(
    "SET_BACK_HANDLER",
    {enable},
    {
      browserFallback: createBrowserSuccessFallback({enabled: false}),
    }
  );
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

  return executeBridgeApi(
    "SHOW_TOAST",
    {message: normalizedMessage},
    {
      browserFallback: () => {
        notifyToastRequested(normalizedMessage, options);
        logInfo("[toast]", normalizedMessage);

        return webSuccess({shown: true, channel: getFeedbackChannel()});
      },
    }
  );
}

/**
 * Android 앱이면 네이티브 기기 정보를 요청하고, 웹이면 platformStore의 탐지 정보를 반환합니다.
 */
export async function getDeviceInfo() {
  return executeBridgeApi(
    "GET_DEVICE_INFO",
    {},
    {
      browserFallback: () => webSuccess(getStore().info),
    }
  );
}
export async function writeNativeLog(data) {
  return executeBridgeApi(
    "WRITE_LOG",
    {data},
    {
      browserFallback: () => {
        logInfo("[native-log]", data);

        return webSuccess({written: true});
      },
    }
  );
}
export async function closeApp() {
  return executeBridgeApi(
    "CLOSE_APP",
    {},
    {
      browserFallback: () => {
        window.close();

        return webSuccess({closed: false});
      },
    }
  );
}
