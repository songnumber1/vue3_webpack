const {defineConfig} = require("@vue/cli-service");

module.exports = defineConfig({
  // chainWebpack: (config) => {
  //   config.module.rules.delete("eslint");
  // },

  // transpileDependencies: true,

  devServer: {
    proxy: "http://localhost:8080",
  },
  pluginOptions: {
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    },
  },
});
