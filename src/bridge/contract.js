import {GetUserRequest, GetUserResponse} from "./schemas/getUser";
import {LoginRequest, LoginResponse} from "./schemas/login";
import {UploadFileRequest, UploadFileResponse} from "./schemas/uploadFile";
import {
  CopyClipboardRequest,
  CopyClipboardResponse,
  EmptyNativeRequest,
  GetAppVersionResponse,
  GetPushTokenResponse,
} from "./schemas/native";
import {
  NativeEventAckResponse,
  OnAppResumeRequest,
  OnBackPressedRequest,
  OnPushClickRequest,
} from "./schemas/nativeEvents";
import {BaseResponseError} from "./schemas/base";
import {BRIDGE_CATEGORY} from "./bridgeConstants";

export const WebApiContract = {
  GET_USER: {
    request: GetUserRequest,
    response: GetUserResponse,
    error: BaseResponseError,
    description: "JS에서 axios 또는 mock API로 유저를 조회한 뒤 표준 응답으로 정규화합니다.",
    tag: "REST / Web API",
    category: BRIDGE_CATEGORY.WEB_API,
  },

  LOGIN: {
    request: LoginRequest,
    response: LoginResponse,
    error: BaseResponseError,
    description: "JS에서 로그인 API를 호출한 뒤 필요 시 Android로 결과를 전달할 수 있는 표준 응답입니다.",
    tag: "REST / Web API",
    category: BRIDGE_CATEGORY.WEB_API,
  },

  UPLOAD_FILE: {
    request: UploadFileRequest,
    response: UploadFileResponse,
    error: BaseResponseError,
    description: "JS에서 파일 업로드 API를 호출한 뒤 표준 응답으로 정규화합니다.",
    tag: "REST / Web API",
    category: BRIDGE_CATEGORY.WEB_API,
  },
};

export const JsToAndroidContract = {
  GET_APP_VERSION: {
    request: EmptyNativeRequest,
    response: GetAppVersionResponse,
    error: BaseResponseError,
    description: "JS가 Android Bridge에 앱 버전 정보를 요청합니다.",
    tag: "JS → Android",
    category: BRIDGE_CATEGORY.JS_TO_ANDROID,
  },

  GET_PUSH_TOKEN: {
    request: EmptyNativeRequest,
    response: GetPushTokenResponse,
    error: BaseResponseError,
    description: "JS가 Android Bridge에 푸시 토큰을 요청합니다.",
    tag: "JS → Android",
    category: BRIDGE_CATEGORY.JS_TO_ANDROID,
  },

  COPY_CLIPBOARD: {
    request: CopyClipboardRequest,
    response: CopyClipboardResponse,
    error: BaseResponseError,
    description: "JS가 Android Bridge에 클립보드 복사를 요청합니다.",
    tag: "JS → Android",
    category: BRIDGE_CATEGORY.JS_TO_ANDROID,
  },
};

export const AndroidToJsContract = {
  ON_APP_RESUME: {
    request: OnAppResumeRequest,
    response: NativeEventAckResponse,
    error: BaseResponseError,
    description: "Android가 WebView 재개 이벤트를 JS로 전달합니다.",
    tag: "Android → JS",
    category: BRIDGE_CATEGORY.ANDROID_TO_JS,
  },

  ON_BACK_PRESSED: {
    request: OnBackPressedRequest,
    response: NativeEventAckResponse,
    error: BaseResponseError,
    description: "Android 뒤로가기 입력을 JS 라우터/상태 처리로 전달합니다.",
    tag: "Android → JS",
    category: BRIDGE_CATEGORY.ANDROID_TO_JS,
  },

  ON_PUSH_CLICK: {
    request: OnPushClickRequest,
    response: NativeEventAckResponse,
    error: BaseResponseError,
    description: "Android 푸시 클릭 payload를 JS 라우터/상태 처리로 전달합니다.",
    tag: "Android → JS",
    category: BRIDGE_CATEGORY.ANDROID_TO_JS,
  },
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

export function getContractsByCategory(category = BRIDGE_CATEGORY.ALL) {
  if (category === BRIDGE_CATEGORY.ALL) return BridgeContract;
  return BridgeContractGroups[category] || BridgeContract;
}
