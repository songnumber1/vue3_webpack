const {defineConfig} = require("@vue/cli-service");

const API_SERVER_TARGET =
  process.env.VUE_APP_API_SERVER_TARGET || "http://localhost:8081";

module.exports = defineConfig({
  transpileDependencies: false,

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

    /**
     * 로컬 실행 안정성을 위해 기본은 HTTP로 실행합니다.
     * HTTPS 인증서 문제로 backend 통신이 막히는 상황을 피하기 위한 설정입니다.
     */
    https: false,

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
  },
});

// 참고: HTTPS 설정이 필요한 경우, 인증서 파일을 cert 디렉토리에 위치시키고 아래 설정을 활성화하세요.
// const fs = require("fs");
// const path = require("path");
// const {defineConfig} = require("@vue/cli-service");

// const certDir = path.resolve(__dirname, "cert");

// const keyPath = path.join(certDir, "localhost+1-key.pem");
// const certPath = path.join(certDir, "localhost+1.pem");

// module.exports = defineConfig({
//   transpileDependencies: true,

//   productionSourceMap: false,

//   configureWebpack: {
//     optimization: {
//       /**
//        * Swagger/vendor 번들 최소화 제거
//        * Node16 환경 빌드 속도 개선
//        */
//       minimize: false,
//     },
//   },

//   devServer: {
//     host: "0.0.0.0",

//     port: 8080,

//     historyApiFallback: true,

//     https: {
//       key: fs.readFileSync(keyPath),
//       cert: fs.readFileSync(certPath),
//     },

//     allowedHosts: "all",

//     client: {
//       overlay: {
//         warnings: false,
//         errors: true,
//       },
//     },

//     headers: {
//       "Access-Control-Allow-Origin": "*",
//     },
//   },
// });
