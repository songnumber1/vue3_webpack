import { createApp } from "vue";
import IframeApp from "./IframeApp.vue";
import iframeRouter from "./router/iframe";

createApp(IframeApp).use(iframeRouter).mount("#app");
