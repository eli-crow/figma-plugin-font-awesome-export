const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");
const path = require("path");

module.exports = (env, argv) => ({
  mode: argv.mode === "production" ? "production" : "development",
  devtool: argv.mode === "production" ? false : "inline-source-map",

  entry: {
    ui: "./src/ui/index.ts",
    code: "./src/code.ts",
  },

  module: {
    rules: [
      { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
      {
        test: /\.css$/,
        loader: [{ loader: "style-loader" }, { loader: "css-loader" }],
      },
      { test: /\.(png|jpg|gif|webp|svg)$/, loader: [{ loader: "url-loader" }] },
    ],
  },

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/ui/ui.html",
      filename: "ui.html",
      inlineSource: ".(js)$",
      chunks: ["ui"],
    }),
    new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
  ],
});
