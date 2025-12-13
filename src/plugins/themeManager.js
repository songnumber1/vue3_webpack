export default {
  install(app) {
    app.config.globalProperties.$theme = {
      setTheme(t) {
        document.documentElement.dataset.theme = t;
      },
      getTheme() {
        return document.documentElement.dataset.theme;
      },
    };
  },
};
