const fs = require("fs");
const {defineConfig} = require("@vue/cli-service");

const isHttps = process.env.VUE_APP_HTTPS === "true";

const httpsOptions = isHttps
  ? {
      key: fs.readFileSync("./cert/localhost+1-key.pem"),
      cert: fs.readFileSync("./cert/localhost+1.pem"),
    }
  : false;

module.exports = defineConfig({
  transpileDependencies: true,

  productionSourceMap: false,

  configureWebpack: {
    optimization: {
      /**
       * Swagger/vendor 번들 최소화 제거
       * Node16 환경 빌드 속도 개선
       */
      minimize: false,
    },
  },

  devServer: {
    host: "0.0.0.0",

    port: 8080,

    historyApiFallback: true,

    https: httpsOptions,

    allowedHosts: "all",

    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },

    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
});
