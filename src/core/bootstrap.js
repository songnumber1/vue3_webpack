import {createApp} from "vue";
import App from "@/App.vue";
import {resolveAppConfig} from "@/core/config";
import {resolveLayout} from "@/core/resolver/layout";
import {resolveAxios} from "@/core/resolver/axios";
import {applyInterceptors} from "@/core/resolver/interceptor";
import {resolveApi} from "@/core/resolver/api";
import {resolveRouter} from "@/core/resolver/router";
import {resolveBridge} from "@/core/resolver/bridge";
import {resolveStorage} from "@/core/resolver/storage";
import {resolveTheme} from "@/core/resolver/theme";
import {resolveErrorUI} from "@/core/resolver/errorUi";
import {resolveUploadStrategy} from "@/core/resolver/upload";

export async function bootstrap() {
  const appInfo = resolveAppConfig();

  // 테스트용 안드로이드 appInfo 예시
  // const appInfo = {
  //   env: "native",
  //   platform: "android",
  //   appVersion: "1.0.0",
  //   appBuildVersion: "1.0.0",
  //   bridgeVersion: "1.0.0",
  //   token: "002f34df-6b64-48fb-8548-d502b7dbbcc7",
  //   deviceId: null,
  //   lastVersionInfo: {
  //     version: "2.0.0",
  //   },
  // };

  const bridge = resolveBridge(appInfo);
  const storage = resolveStorage(appInfo, bridge);
  const theme = resolveTheme(storage);
  const axios = resolveAxios(appInfo);
  const errorUI = resolveErrorUI(appInfo, bridge);
  const upload = resolveUploadStrategy(appInfo, axios, bridge);

  applyInterceptors(axios, appInfo, {bridge, errorUI});

  const api = resolveApi(appInfo, axios);
  const router = resolveRouter(appInfo);
  const Layout = resolveLayout(appInfo);

  const app = createApp(App);
  app.provide("appContext", {
    appInfo,
    platform: appInfo.platform,
    env: appInfo.env,
    bridge,
    storage,
    theme,
    axios,
    api,
    errorUI,
    upload,
  });

  app.component("AppLayout", Layout);
  app.use(router);
  app.mount("#app");
}
