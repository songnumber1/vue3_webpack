import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

import responsiveManager from "./plugins/responsiveManager";
import themeManager from "./plugins/themeManager";

import "./assets/tokens/spacing.css";
import "./assets/tokens/typography.css";
import "./assets/tokens/radius.css";
import "./assets/tokens/z-index.css";
import "./assets/tokens/responsive.css";
import "./assets/themes/light.css";
import "./assets/themes/dim.css";
import "./assets/themes/dark.css";
import "./assets/themes/summer.css";
import "./assets/playground.css";
import "./assets/preview-fallback.css";
import "./assets/main.scss";
import "./assets/note.css";

// KaTeX base styles (used by markdown-it-katex)
import "katex/dist/katex.min.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.use(responsiveManager);
app.use(themeManager);

app.config.compilerOptions.isCustomElement = () => false;

app.mount("#app");
