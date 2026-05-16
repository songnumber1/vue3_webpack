import {createApp} from "vue";
import {createPinia} from "pinia";
import {usePlatformStore} from "@/stores/platformStore";
import App from "@/App.vue";
import {resolveAppConfig} from "@/core/config";
import {resolveLayout} from "@/core/resolver/layout";
import {resolveAxios} from "@/core/resolver/axios";
import {resolveAuthAxios} from "@/core/resolver/authAxios";
import {applyInterceptors} from "@/core/resolver/interceptor";
import {resolveApi} from "@/core/resolver/api";
import {resolveRouter} from "@/core/resolver/router";
import {resolveBridge} from "@/core/resolver/bridge";
import {resolveStorage} from "@/core/resolver/storage";
import {resolveTheme} from "@/core/resolver/theme";
import {resolveErrorUI} from "@/core/resolver/errorUi";
import {resolveUploadStrategy} from "@/core/resolver/upload";
import {i18n} from "@/i18n";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description bootstrap 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function bootstrap() {
  const appInfo = resolveAppConfig();


  const bridge = resolveBridge(appInfo);
  const storage = resolveStorage(appInfo, bridge);
  const theme = resolveTheme(storage);
  const axios = resolveAxios(appInfo);
  const authAxios = resolveAuthAxios(appInfo);
  const errorUI = resolveErrorUI(appInfo, bridge);
  const upload = resolveUploadStrategy(appInfo, axios, bridge);

  applyInterceptors(axios, appInfo, {bridge, errorUI});

  const api = resolveApi(appInfo, axios);
  const router = resolveRouter(appInfo, {authAxios});
  const Layout = resolveLayout(appInfo);

  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(i18n);
  const platformStore = usePlatformStore();
  platformStore.initialize(appInfo);

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (
    typeof window !== "undefined" &&
    Array.isArray(window.__pendingNativeEvents)
  ) {
    window.__pendingNativeEvents.splice(0).forEach((event) => {
      platformStore.recordNativeEvent(event.type, event.payload);
    });
  }

  app.provide("appContext", {
    appInfo,
    platform: appInfo.platform,
    env: appInfo.env,
    bridge,
    storage,
    theme,
    axios,
    authAxios,
    api,
    errorUI,
    upload,
    platformStore,
  });

  app.component("AppLayout", Layout);
  app.use(router);
  app.mount("#app");
}
