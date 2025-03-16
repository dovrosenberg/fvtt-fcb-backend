const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: path.resolve(__dirname, "src/server.ts"), 
  target: "node", 
  externals: [nodeExternals()], 
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "server.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src/"), 
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
