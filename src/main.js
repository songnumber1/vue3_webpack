import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import responsiveManager from "./plugins/responsiveManager";
import themeManager from "./plugins/themeManager";

import "./assets/main.scss";

const app = createApp(App);

app.use(router);
app.use(responsiveManager);
app.use(themeManager);

app.mount("#app");
