import {isNativeApp} from "@/core/config";

function applyWebRequestInterceptor(instance) {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });
}
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
export function applyInterceptors(instance, appInfo, context = {}) {
  const {bridge, errorUI} = context;

  if (isNativeApp(appInfo)) {
    applyNativeRequestInterceptor(instance, bridge, appInfo);
  } else {
    applyWebRequestInterceptor(instance);
  }

  applyResponseInterceptor(instance, errorUI);
}
