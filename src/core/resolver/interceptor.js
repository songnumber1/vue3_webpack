import {isNativeApp} from "@/core/config";

/**
 * applyWebRequestInterceptor 처리 함수입니다.
 * @param {*} instance 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function applyWebRequestInterceptor(instance) {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });
}

/**
 * applyNativeRequestInterceptor 처리 함수입니다.
 * @param {*} instance 함수 실행에 필요한 입력값입니다.
 * @param {*} bridge 함수 실행에 필요한 입력값입니다.
 * @param {*} appInfo 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function applyNativeRequestInterceptor(instance, bridge, appInfo) {
  instance.interceptors.request.use((config) => {
    const token = bridge?.getToken?.() || appInfo?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["X-App-Version"] = appInfo?.appVersion || "";
    config.headers["X-App-Build-Version"] = appInfo?.appBuildVersion || "";
    config.headers["X-Bridge-Version"] = appInfo?.bridgeVersion || "";

    return config;
  });
}

/**
 * applyResponseInterceptor 처리 함수입니다.
 * @param {*} instance 함수 실행에 필요한 입력값입니다.
 * @param {*} errorUI 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function applyResponseInterceptor(instance, errorUI) {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;

      if (status === 401) {
        errorUI?.notify?.("인증 정보가 만료되었습니다.");
      }

      if (status >= 500) {
        errorUI?.notify?.("서버 오류가 발생했습니다.");
      }

      return Promise.reject(error);
    }
  );
}

/**
 * applyInterceptors 함수입니다.
 * @param {*} instance 함수 실행에 필요한 값입니다.
 * @param {*} appInfo 함수 실행에 필요한 값입니다.
 * @param {*} context 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function applyInterceptors(instance, appInfo, context = {}) {
  const {bridge, errorUI} = context;

  if (isNativeApp(appInfo)) {
    applyNativeRequestInterceptor(instance, bridge, appInfo);
  } else {
    applyWebRequestInterceptor(instance);
  }

  applyResponseInterceptor(instance, errorUI);
}
