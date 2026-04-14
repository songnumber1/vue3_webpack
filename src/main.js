import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { initializeAppConfig } from '@/config/appConfig';
import { applyThemeAttributes } from '@/theme/themeManager';
import '@/styles/reset.css';
import '@/styles/variables.css';
import '@/styles/base.css';
import '@/styles/responsive.css';

const appConfig = initializeAppConfig();
applyThemeAttributes(appConfig);

const app = createApp(App);
app.config.globalProperties.$appConfig = appConfig;
app.provide('appConfig', appConfig);
app.use(router);
app.mount('#app');
