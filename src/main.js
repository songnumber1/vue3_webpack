import {createApp} from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import {loadFonts} from "./plugins/webfontloader";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

loadFonts();

createApp(App)
  .use(router)
  .use(store)
  .use(vuetify)
  .use(ElementPlus)
  .mount("#app");
