import {GetUserRequest, GetUserResponse} from "./schemas/getUser";
import {LoginRequest, LoginResponse} from "./schemas/login";
import {UploadFileRequest, UploadFileResponse} from "./schemas/uploadFile";
import {
  // 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
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
  StorageSetRequest,
  StorageSetResponse,
  StorageRemoveRequest,
  StorageRemoveResponse,
  WriteLogRequest,
  WriteLogResponse,
} from "./schemas/native";
import {
  NativeEventAckResponse,
  OnAppPauseRequest,
  OnAppResumeRequest,
  OnBackPressedRequest,
  OnFileSelectedRequest,
  OnNativeErrorRequest,
  OnNetworkChangeRequest,
  OnPushClickRequest,
  OnRequestCancelRequest,
  OnSessionExpiredRequest,
  OnWebViewCloseRequest,
} from "./schemas/nativeEvents";
import {BaseResponseError} from "./schemas/base";
import {BRIDGE_CATEGORY} from "./bridgeConstants";

export const WebApiContract = {
  GET_USER: {
    request: GetUserRequest,
    response: GetUserResponse,
    error: BaseResponseError,
    description:
      "JS에서 실제 backend 유저 조회 API를 호출한 뒤 표준 응답으로 정규화합니다.",
    httpMethod: "GET",
    httpPath: "/users/:id",
    tag: "REST / Web API",
    category: BRIDGE_CATEGORY.WEB_API,
  },
  LOGIN: {
    request: LoginRequest,
    response: LoginResponse,
    error: BaseResponseError,
    description: "JS에서 실제 backend 로그인 API를 호출합니다.",
    httpMethod: "POST",
    httpPath: "/login",
    tag: "REST / Web API",
    category: BRIDGE_CATEGORY.WEB_API,
  },
  UPLOAD_FILE: {
    request: UploadFileRequest,
    response: UploadFileResponse,
    error: BaseResponseError,
    description: "JS에서 실제 backend 파일 업로드 API를 호출합니다.",
    httpMethod: "POST",
    httpPath: "/files/upload",
    tag: "REST / Web API",
    category: BRIDGE_CATEGORY.WEB_API,
  },
};

const jsToAndroid = (
  request,
  response,
  description,
  required = "required"
) => ({
  request,
  response,
  error: BaseResponseError,
  description,
  tag: "JS → Android",
  category: BRIDGE_CATEGORY.JS_TO_ANDROID,
  required,
});
export const JsToAndroidContract = {
  OPEN_EXTERNAL_BROWSER: jsToAndroid(
    OpenExternalBrowserRequest,
    OpenExternalBrowserResponse,
    "외부 링크를 Android Chrome 등 외부 브라우저로 엽니다."
  ),
  OPEN_FILE_PICKER: jsToAndroid(
    OpenFilePickerRequest,
    OpenFilePickerResponse,
    "파일/카메라/갤러리 통합 선택기를 엽니다."
  ),
  GET_PUSH_TOKEN: jsToAndroid(
    EmptyNativeRequest,
    GetPushTokenResponse,
    "FCM 푸시 토큰을 조회합니다."
  ),
  GET_APP_VERSION: jsToAndroid(
    EmptyNativeRequest,
    GetAppVersionResponse,
    "앱/브릿지 버전을 조회합니다."
  ),
  COPY_CLIPBOARD: jsToAndroid(
    CopyClipboardRequest,
    CopyClipboardResponse,
    "클립보드에 텍스트를 복사합니다."
  ),
  SHARE: jsToAndroid(
    ShareRequest,
    ShareResponse,
    "Android 시스템 공유창을 실행합니다."
  ),
  CHECK_NETWORK: jsToAndroid(
    EmptyNativeRequest,
    CheckNetworkResponse,
    "네트워크 상태를 조회합니다."
  ),
  GET_STORAGE: jsToAndroid(
    StorageGetRequest,
    StorageGetResponse,
    "Android secure storage에서 값을 조회합니다.",
    "recommended"
  ),
  SET_STORAGE: jsToAndroid(
    StorageSetRequest,
    StorageSetResponse,
    "Android secure storage에 값을 저장합니다.",
    "recommended"
  ),
  REMOVE_STORAGE: jsToAndroid(
    StorageRemoveRequest,
    StorageRemoveResponse,
    "Android secure storage에서 값을 삭제합니다.",
    "recommended"
  ),
  CANCEL_REQUEST: jsToAndroid(
    CancelRequestRequest,
    CancelRequestResponse,
    "업로드/SSE 요청을 취소합니다.",
    "recommended"
  ),
  SET_BACK_HANDLER: jsToAndroid(
    SetBackHandlerRequest,
    SetBackHandlerResponse,
    "웹에서 Android 뒤로가기 제어 여부를 설정합니다.",
    "recommended"
  ),
  SHOW_TOAST: jsToAndroid(
    ShowToastRequest,
    ShowToastResponse,
    "네이티브 토스트를 표시합니다.",
    "recommended"
  ),
  GET_DEVICE_INFO: jsToAndroid(
    EmptyNativeRequest,
    GetDeviceInfoResponse,
    "OS/디바이스 상세 정보를 조회합니다.",
    "optional"
  ),
  WRITE_LOG: jsToAndroid(
    WriteLogRequest,
    WriteLogResponse,
    "네이티브 로그를 저장합니다.",
    "optional"
  ),
  CLOSE_APP: jsToAndroid(
    EmptyNativeRequest,
    CloseAppResponse,
    "Android 앱 종료를 요청합니다.",
    "optional"
  ),
};

/**
 * @description androidToJs 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} request - request 입력값입니다.
 * @param {*} description - description 입력값입니다.
 * @param {*} required - required 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
const androidToJs = (request, description, required = "required") => ({
  request,
  response: NativeEventAckResponse,
  error: BaseResponseError,
  description,
  tag: "Android → JS",
  category: BRIDGE_CATEGORY.ANDROID_TO_JS,
  required,
});
export const AndroidToJsContract = {
  ON_APP_RESUME: androidToJs(
    OnAppResumeRequest,
    "포그라운드 복귀 이벤트를 JS로 전달합니다."
  ),
  ON_BACK_PRESSED: androidToJs(
    OnBackPressedRequest,
    "Android 뒤로가기 입력을 JS로 전달합니다."
  ),
  ON_FILE_SELECTED: androidToJs(
    OnFileSelectedRequest,
    "파일/카메라 선택 결과를 JS로 전달합니다."
  ),
  ON_NETWORK_CHANGE: androidToJs(
    OnNetworkChangeRequest,
    "네트워크 상태 변경을 JS로 전달합니다."
  ),
  ON_PUSH_CLICK: androidToJs(
    OnPushClickRequest,
    "푸시 클릭 payload를 JS로 전달합니다."
  ),
  ON_SESSION_EXPIRED: androidToJs(
    OnSessionExpiredRequest,
    "세션 만료를 JS로 통보합니다."
  ),
  ON_APP_PAUSE: androidToJs(
    OnAppPauseRequest,
    "백그라운드 진입 이벤트를 JS로 전달합니다.",
    "recommended"
  ),
  ON_WEBVIEW_CLOSE: androidToJs(
    OnWebViewCloseRequest,
    "WebView 종료 예정 이벤트를 JS로 전달합니다.",
    "recommended"
  ),
  ON_REQUEST_CANCEL: androidToJs(
    OnRequestCancelRequest,
    "요청 강제 종료 이벤트를 JS로 전달합니다.",
    "recommended"
  ),
  ON_NATIVE_ERROR: androidToJs(
    OnNativeErrorRequest,
    "네이티브 오류를 JS로 전달합니다.",
    "optional"
  ),
};
export const BridgeContract = {
  ...WebApiContract,
  ...JsToAndroidContract,
  ...AndroidToJsContract,
};
export const BridgeContractGroups = {
  [BRIDGE_CATEGORY.WEB_API]: WebApiContract,
  [BRIDGE_CATEGORY.JS_TO_ANDROID]: JsToAndroidContract,
  [BRIDGE_CATEGORY.ANDROID_TO_JS]: AndroidToJsContract,
};
/**
 * @description getContractsByCategory 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} category - category 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function getContractsByCategory(category = BRIDGE_CATEGORY.ALL) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (category === BRIDGE_CATEGORY.ALL) return BridgeContract;
  // 계산된 결과를 호출부로 반환합니다.
  return BridgeContractGroups[category] || BridgeContract;
}
