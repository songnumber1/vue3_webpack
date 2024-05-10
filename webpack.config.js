const path = require("path");
const StyleLintPlugin = require("stylelint-webpack-plugin");

const resolve = (dir) => path.join(__dirname, dir);
module.exports = {
  productionSourceMap: "true",

  configureWebpack: {
    mode: "production",
    devtool: "hidden-source-map",
  },
  resolve: {
    alias: {
      main: resolve("src"), // 추가 alias 설정
    },
  },
  plugins: [
    new StyleLintPlugin({
      files: ["src/**/*.{vue,scss}"],
      emitError: true,
      emitWarning: true,
      failOnError: false,
      failOnWarning: false,
    }),
  ],
};
