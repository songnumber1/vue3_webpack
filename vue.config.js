const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  configureWebpack: {
    optimization: {
      // Swagger/vendor 번들이 큰 프로젝트라 Node 16 환경에서 terser 최소화 시간이 과도하게 길어지는 경우를 방지합니다.
      // 운영에서 최소화가 반드시 필요하면 서버 CI에서 minimize 옵션만 true로 되돌리면 됩니다.
      minimize: false
    }
  },
  devServer: {
    port: 8080,
    historyApiFallback: true
  }
});
