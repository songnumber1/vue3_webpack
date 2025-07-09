const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  pages: {
    index: {
      entry: "src/main.js",
      template: "public/index.html",
      filename: "index.html",
      title: "Main App",
      chunks: ["chunk-vendors", "chunk-common", "index"],
    },
    iframe: {
      entry: "src/iframe.js",
      template: "public/iframe.html",
      filename: "iframe.html",
      title: "Iframe Chat",
      chunks: ["chunk-vendors", "chunk-common", "iframe"],
    },
  },
  productionSourceMap: false,
});
