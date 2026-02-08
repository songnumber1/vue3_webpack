const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const webpack = require("webpack");

const isProd = process.env.NODE_ENV === "production";

module.exports = {
  entry: path.resolve(__dirname, "src/main.js"),

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.[contenthash].js",
    clean: true,
    publicPath: "/",
  },

  resolve: {
    extensions: [".js", ".vue", ".json"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  devServer: {
    static: { directory: path.join(__dirname, "public") },
    historyApiFallback: true,
    hot: true,
    port: 5174,
    client: { overlay: true },
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: { sourceMap: true },
          },
          {
            loader: "postcss-loader",
            options: { sourceMap: true },
          },
        ],
      },
      {
        test: /\.(sa|sc)ss$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: { sourceMap: true },
          },
          {
            loader: "postcss-loader",
            options: { sourceMap: true },
          },
          {
            loader: "sass-loader",
            options: { sourceMap: true },
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
        type: "asset/resource",
        generator: {
          filename: "assets/[name].[hash][ext]",
        },
      },
    ],
  },

  plugins: [
    // ✅ Vue SFC
    new VueLoaderPlugin(),

    // ✅ index.html
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"),
    }),

    // ✅ Vue 3 esm-bundler feature flag (경고 제거 핵심)
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: JSON.stringify(true), // Option API 사용
      __VUE_PROD_DEVTOOLS__: JSON.stringify(!isProd), // prod에서 devtools off
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
    }),
  ],
};
