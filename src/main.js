import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import responsiveManager from "./plugins/responsiveManager";
import themeManager from "./plugins/themeManager";

import "./assets/tokens/spacing.css";
import "./assets/tokens/typography.css";
import "./assets/tokens/radius.css";
import "./assets/tokens/z-index.css";
import "./assets/themes/light.css";
import "./assets/themes/dim.css";
import "./assets/themes/dark.css";
import "./assets/themes/summer.css";
import "./assets/playground.css";
import "./assets/main.scss";

const app = createApp(App);

app.use(router);
app.use(store);
app.use(responsiveManager);
app.use(themeManager);

app.mount("#app");
