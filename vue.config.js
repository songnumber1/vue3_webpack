const fs = require("fs");
const path = require("path");
const {defineConfig} = require("@vue/cli-service");

const certDir = path.resolve(__dirname, "cert");

const keyPath = path.join(certDir, "localhost+1-key.pem");
const certPath = path.join(certDir, "localhost+1.pem");

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

    https: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },

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
