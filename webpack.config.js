/* eslint-disable @typescript-eslint/no-var-requires,functional/immutable-data,functional/no-expression-statement */

const path = require("path");
const GasPlugin = require("gas-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  devtool: false,
  output: {
    filename: "bundle.js",
    path: path.join(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
    ],
  },
  resolve: {
    modules: [path.join(__dirname, "node_modules"), "node_modules"],
    extensions: [".ts", ".js"],
  },
  plugins: [new GasPlugin()],
};
