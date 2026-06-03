/**
 * @file platform/bridge/bridgeApi.registry.js
 * @description JS → Android bridge API의 순수 registry입니다.
 *
 * 주의:
 * - 이 파일은 contract/native transport에서 함께 참조하는 순수 정의 계층입니다.
 * - store, i18n, window/navigator 접근 같은 runtime 의존성을 넣지 않습니다.
 * - Android direct bridge method 이름까지 함께 관리해 API 추가/삭제 시 누락을 줄입니다.
 */

import {
  CancelRequestRequest,
  CancelRequestResponse,
  CheckNetworkResponse,
  CloseAppResponse,
  CopyClipboardRequest,
  CopyClipboardResponse,
  EmptyNativeRequest,
  GetAppVersionResponse,
  GetDeviceInfoResponse,
  GetPushTokenResponse,
  OpenExternalBrowserRequest,
  OpenExternalBrowserResponse,
  OpenFilePickerRequest,
  OpenFilePickerResponse,
  SetBackHandlerRequest,
  SetBackHandlerResponse,
  ShareRequest,
  ShareResponse,
  ShowToastRequest,
  ShowToastResponse,
  StorageGetRequest,
  StorageGetResponse,
  StorageRemoveRequest,
  StorageRemoveResponse,
  StorageSetRequest,
  StorageSetResponse,
  WriteLogRequest,
  WriteLogResponse,
} from "./schemas/native";

export const JS_TO_ANDROID_API_REGISTRY = {
  OPEN_EXTERNAL_BROWSER: {
    request: OpenExternalBrowserRequest,
    response: OpenExternalBrowserResponse,
    description: "외부 링크를 Android Chrome 등 외부 브라우저로 엽니다.",
    required: "required",
    androidMethod: "openExternalBrowser",
  },
  OPEN_FILE_PICKER: {
    request: OpenFilePickerRequest,
    response: OpenFilePickerResponse,
    description: "파일/카메라/갤러리 통합 선택기를 엽니다.",
    required: "required",
    androidMethod: "openFilePicker",
  },
  GET_PUSH_TOKEN: {
    request: EmptyNativeRequest,
    response: GetPushTokenResponse,
    description: "FCM 푸시 토큰을 조회합니다.",
    required: "required",
    androidMethod: "getPushToken",
  },
  GET_APP_VERSION: {
    request: EmptyNativeRequest,
    response: GetAppVersionResponse,
    description: "앱/브릿지 버전을 조회합니다.",
    required: "required",
    androidMethod: "getAppVersion",
  },
  COPY_CLIPBOARD: {
    request: CopyClipboardRequest,
    response: CopyClipboardResponse,
    description: "클립보드에 텍스트를 복사합니다.",
    required: "required",
    androidMethod: "copyClipboard",
  },
  SHARE: {
    request: ShareRequest,
    response: ShareResponse,
    description: "Android 시스템 공유창을 실행합니다.",
    required: "required",
    androidMethod: "share",
  },
  CHECK_NETWORK: {
    request: EmptyNativeRequest,
    response: CheckNetworkResponse,
    description: "네트워크 상태를 조회합니다.",
    required: "required",
    androidMethod: "checkNetwork",
  },
  GET_STORAGE: {
    request: StorageGetRequest,
    response: StorageGetResponse,
    description: "Android secure storage에서 값을 조회합니다.",
    required: "recommended",
    androidMethod: "getStorage",
  },
  SET_STORAGE: {
    request: StorageSetRequest,
    response: StorageSetResponse,
    description: "Android secure storage에 값을 저장합니다.",
    required: "recommended",
    androidMethod: "setStorage",
  },
  REMOVE_STORAGE: {
    request: StorageRemoveRequest,
    response: StorageRemoveResponse,
    description: "Android secure storage에서 값을 삭제합니다.",
    required: "recommended",
    androidMethod: "removeStorage",
  },
  CANCEL_REQUEST: {
    request: CancelRequestRequest,
    response: CancelRequestResponse,
    description: "업로드/SSE 요청을 취소합니다.",
    required: "recommended",
    androidMethod: "cancelRequest",
  },
  SET_BACK_HANDLER: {
    request: SetBackHandlerRequest,
    response: SetBackHandlerResponse,
    description: "웹에서 Android 뒤로가기 제어 여부를 설정합니다.",
    required: "recommended",
    androidMethod: "setBackHandler",
  },
  SHOW_TOAST: {
    request: ShowToastRequest,
    response: ShowToastResponse,
    description: "네이티브 토스트를 표시합니다.",
    required: "recommended",
    androidMethod: "showToast",
  },
  GET_DEVICE_INFO: {
    request: EmptyNativeRequest,
    response: GetDeviceInfoResponse,
    description: "OS/디바이스 상세 정보를 조회합니다.",
    required: "optional",
    androidMethod: "getDeviceInfo",
  },
  WRITE_LOG: {
    request: WriteLogRequest,
    response: WriteLogResponse,
    description: "네이티브 로그를 저장합니다.",
    required: "optional",
    androidMethod: "writeLog",
  },
  CLOSE_APP: {
    request: EmptyNativeRequest,
    response: CloseAppResponse,
    description: "Android 앱 종료를 요청합니다.",
    required: "optional",
    androidMethod: "closeApp",
  },
};

export function getJsToAndroidApi(type) {
  return JS_TO_ANDROID_API_REGISTRY[type] || null;
}
