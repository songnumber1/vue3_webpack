const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");
const HtmlWebpackPlugin = require("html-webpack-plugin");

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
    mode: "development",
    entry: target === "all" ? entries : { [target]: entries[target] },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].bundle.js",
      clean: true,
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
        { test: /\.css$/, use: ["style-loader", "css-loader"] },
        { test: /\.js$/, exclude: /node_modules/, use: "babel-loader" },
      ],
    },
    plugins: [new VueLoaderPlugin(), ...htmlPages],
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
