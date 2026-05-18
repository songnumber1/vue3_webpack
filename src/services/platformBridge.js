import {callNative} from "@/bridge/bridgeClient";
import {usePlatformStore} from "@/stores/platformStore";
import {logInfo} from "@/utils/logger";
import {copyText as copyWebText} from "@/utils/clipboard";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description getStore 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getStore() {
  return usePlatformStore();
}

/**
 * @description isAndroidApp 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function isAndroidApp() {
  return getStore().info.isAndroidApp;
}

/**
 * @description webSuccess 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} data - data 입력값입니다.
 * @param {*} message - message 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function webSuccess(data = {}, message = "브라우저에서 처리되었습니다.") {
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
 * @description copyClipboardByPlatform 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} text - text 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function copyClipboardByPlatform(text) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp()) return callNative("COPY_CLIPBOARD", {text});
  const copied = await copyWebText(text);

  return webSuccess(
    {copied},
    copied ? "브라우저 클립보드에 복사되었습니다." : "복사 실패"
  );
}

/**
 * @description openExternalBrowser 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} url - url 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function openExternalBrowser(url) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp()) return callNative("OPEN_EXTERNAL_BROWSER", {url});
  window.open(url, "_blank", "noopener,noreferrer");

  return webSuccess({opened: true});
}

/**
 * @description openNativeFilePicker 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} options - options 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function openNativeFilePicker(options = {}) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp()) return callNative("OPEN_FILE_PICKER", {options});

  return webSuccess(
    {opened: false, reason: "browser-file-input-required"},
    "브라우저에서는 input[type=file]을 사용해야 합니다."
  );
}

/**
 * @description getPushToken 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function getPushToken() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!isAndroidApp())
    return webSuccess(
      {token: ""},
      "브라우저에서는 FCM 토큰을 Native Bridge에서 조회하지 않습니다."
    );
  const res = await callNative("GET_PUSH_TOKEN", {});
  getStore().setPushToken(res.data?.token);

  return res;
}

/**
 * @description getAppVersion 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function getAppVersion() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!isAndroidApp()) return webSuccess(getStore().info);
  const res = await callNative("GET_APP_VERSION", {});
  getStore().setAppVersionInfo(res.data);

  return res;
}

/**
 * @description shareByPlatform 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} data - data 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function shareByPlatform(data) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp()) return callNative("SHARE", {data});
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (navigator.share) {
    await navigator.share(data);

    return webSuccess({shared: true});
  }
  throw new Error("현재 브라우저에서 공유 기능을 지원하지 않습니다.");
}

/**
 * @description checkNetworkByPlatform 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function checkNetworkByPlatform() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp()) return callNative("CHECK_NETWORK", {});

  return webSuccess({online: navigator.onLine, type: "browser"});
}

/**
 * @description getNativeStorage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} key - key 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function getNativeStorage(key) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp()) return callNative("GET_STORAGE", {key});
  const value = window.localStorage?.getItem(key) ?? null;

  return webSuccess({key, value});
}

/**
 * @description setNativeStorage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} key - key 입력값입니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function setNativeStorage(key, value) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp()) return callNative("SET_STORAGE", {key, value});
  window.localStorage?.setItem(key, String(value));

  return webSuccess({key, saved: true});
}

/**
 * @description removeNativeStorage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} key - key 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function removeNativeStorage(key) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp()) return callNative("REMOVE_STORAGE", {key});
  window.localStorage?.removeItem(key);

  return webSuccess({key, removed: true});
}

/**
 * @description cancelNativeRequest 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} id - id 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function cancelNativeRequest(id) {
  return isAndroidApp()
    ? callNative("CANCEL_REQUEST", {id})
    : webSuccess({id, cancelled: true});
}

/**
 * @description setBackHandler 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} enable - enable 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function setBackHandler(enable) {
  return isAndroidApp()
    ? callNative("SET_BACK_HANDLER", {enable})
    : webSuccess({enabled: false});
}

/**
 * @description showNativeToast 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} message - message 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function showNativeToast(message) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp()) return callNative("SHOW_TOAST", {message});
  logInfo("[toast]", message);

  return webSuccess({shown: true});
}

/**
 * @description getDeviceInfo 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function getDeviceInfo() {
  return isAndroidApp()
    ? callNative("GET_DEVICE_INFO", {})
    : webSuccess(getStore().info);
}

/**
 * @description writeNativeLog 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} data - data 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function writeNativeLog(data) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp()) return callNative("WRITE_LOG", {data});
  logInfo("[native-log]", data);

  return webSuccess({written: true});
}

/**
 * @description closeApp 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function closeApp() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp()) return callNative("CLOSE_APP", {});
  window.close();

  return webSuccess({closed: false});
}
