const path = require("path");
const fs = require("fs");
const { VueLoaderPlugin } = require("vue-loader");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env = {}) => {
  const target = env.target || "all";

  const entries = {
    main: "./src/main.js",
    iframe: "./src/iframe.js",
  };

  const htmlPages = [];

  if (target === "main" || target === "all") {
    htmlPages.push(
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: "public/index.html",
        chunks: ["main"],
      })
    );
  }

  if (target === "iframe" || target === "all") {
    htmlPages.push(
      new HtmlWebpackPlugin({
        filename: "iframe.html",
        template: "public/iframe.html",
        chunks: ["iframe"],
      })
    );
  }

  return {
    mode: env.mode || "development",
    entry: target === "all" ? entries : { [target]: entries[target] },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "js/[name].[contenthash].js", // ✅ main/iframe JS
      chunkFilename: "js/[name].[contenthash].js", // ✅ runtime/lazy chunk JS
      clean: true,
      assetModuleFilename: "[ext]/[name][hash][ext]", // ✅ assets/img, fonts 분리
    },
    resolve: {
      extensions: [".js", ".vue"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    module: {
      rules: [
        { test: /\.vue$/, use: "vue-loader" },
        { test: /\.css$/, use: [MiniCssExtractPlugin.loader, "css-loader"] },
        { test: /\.js$/, exclude: /node_modules/, use: "babel-loader" },
        {
          test: /\.(png|jpe?g|gif|svg|webp)$/i,
          type: "asset/resource",
          generator: { filename: "img/[name][hash][ext]" }, // ✅ 이미지 분리
        },
        {
          test: /\.(woff2?|eot|ttf|otf)$/i,
          type: "asset/resource",
          generator: { filename: "fonts/[name][hash][ext]" }, // ✅ 폰트 분리
        },
      ],
    },
    plugins: [
      new VueLoaderPlugin(),
      ...htmlPages,
      new MiniCssExtractPlugin({
        filename: "css/[name].[contenthash].css", // ✅ CSS 분리
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "public",
            to: "",
            globOptions: {
              ignore: ["**/index.html", "**/iframe.html"], // ✅ HTML은 복사 제외
            },
          },
        ],
      }),
    ],
    devServer: {
      static: path.join(__dirname, "dist"),
      port: 8080,
      historyApiFallback: {
        rewrites: [
          { from: /^\/iframe/, to: "/iframe.html" },
          { from: /./, to: "/index.html" },
        ],
      },
    },
  };
};
