import {isNativeApp} from "@/core/config";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description applyWebRequestInterceptor 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} instance - instance 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function applyWebRequestInterceptor(instance) {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 계산된 결과를 호출부로 반환합니다.
    return config;
  });
}

/**
 * @description applyNativeRequestInterceptor 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} instance - instance 입력값입니다.
 * @param {*} bridge - bridge 입력값입니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function applyNativeRequestInterceptor(instance, bridge, appInfo) {
  instance.interceptors.request.use((config) => {
    const token = bridge?.getToken?.() || appInfo?.token;

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["X-App-Version"] = appInfo?.appVersion || "";
    config.headers["X-App-Build-Version"] = appInfo?.appBuildVersion || "";
    config.headers["X-Bridge-Version"] = appInfo?.bridgeVersion || "";

    // 계산된 결과를 호출부로 반환합니다.
    return config;
  });
}

/**
 * @description applyResponseInterceptor 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} instance - instance 입력값입니다.
 * @param {*} errorUI - errorUI 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function applyResponseInterceptor(instance, errorUI) {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;

      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (status === 401) {
        errorUI?.notify?.("인증 정보가 만료되었습니다.");
      }

      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (status >= 500) {
        errorUI?.notify?.("서버 오류가 발생했습니다.");
      }

      // 계산된 결과를 호출부로 반환합니다.
      return Promise.reject(error);
    }
  );
}

/**
 * @description applyInterceptors 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} instance - instance 입력값입니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @param {*} context - context 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function applyInterceptors(instance, appInfo, context = {}) {
  const {bridge, errorUI} = context;

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isNativeApp(appInfo)) {
    applyNativeRequestInterceptor(instance, bridge, appInfo);
  } else {
    applyWebRequestInterceptor(instance);
  }

  applyResponseInterceptor(instance, errorUI);
}
