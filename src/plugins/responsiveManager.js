export default {
  install(app) {
    app.config.globalProperties.$responsive = {
      getState() {
        return { bp: window.innerWidth < 768 ? "sm" : "md" };
      },
    };
  },
};
