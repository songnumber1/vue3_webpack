import {createApp} from "vue";
import App from "@/App.vue";
import {resolvePlatform} from "@/core/resolver/platform";
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
  const platform = resolvePlatform();
  const bridge = resolveBridge(platform);
  const storage = resolveStorage(platform, bridge);
  const theme = resolveTheme(storage);
  const axios = resolveAxios(platform);
  const errorUI = resolveErrorUI(platform, bridge);
  const upload = resolveUploadStrategy(platform, axios, bridge);

  applyInterceptors(axios, platform, {bridge, errorUI});

  const api = resolveApi(platform, axios);
  const router = resolveRouter(platform);
  const Layout = resolveLayout(platform);

  const app = createApp(App);
  app.provide("appContext", {
    platform,
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
