function applyWebRequestInterceptor(instance) {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });
}

function applyAndroidRequestInterceptor(instance, bridge) {
  instance.interceptors.request.use((config) => {
    const token = bridge?.getToken?.();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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

export function applyInterceptors(instance, platform, context = {}) {
  const {bridge, errorUI} = context;

  if (platform === "android") {
    applyAndroidRequestInterceptor(instance, bridge);
  } else {
    applyWebRequestInterceptor(instance);
  }

  applyResponseInterceptor(instance, errorUI);
}
