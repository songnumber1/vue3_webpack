const fs = require("fs");
const path = require("path");
const {defineConfig} = require("@vue/cli-service");

const API_SERVER_TARGET =
  process.env.VUE_APP_API_SERVER_TARGET || "http://localhost:8081";

function readBooleanEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["true", "1", "yes", "y", "on"].includes(
    String(value).trim().toLowerCase()
  );
}

function resolveHttpsConfig() {
  if (!readBooleanEnv(process.env.VUE_APP_HTTPS, false)) return false;

  const certDir = path.resolve(__dirname, "cert");
  const keyPath = path.join(certDir, "localhost+1-key.pem");
  const certPath = path.join(certDir, "localhost+1.pem");

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) return true;

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}

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
    allowedHosts: "all",
    https: resolveHttpsConfig(),

    /**
     * frontend는 /api로 요청하고, webpack dev server가 backend로 프록시합니다.
     * 브라우저 관점에서는 same-origin 요청이므로 개발 중 CORS 영향을 최소화할 수 있습니다.
     */
    proxy: {
      "^/api": {
        target: API_SERVER_TARGET,
        changeOrigin: true,
        secure: false,
        logLevel: "debug",
      },
    },

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
