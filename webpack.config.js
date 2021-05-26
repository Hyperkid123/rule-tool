const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const { ModuleFederationPlugin } = require("webpack").container
const deps = require("./package.json").dependencies

const betaEnv = "ci"

const rootFolder = path.resolve(__dirname)
const target = `https://${betaEnv}.cloud.redhat.com`

module.exports = {
  mode: "development",
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
    ],
  },
  resolve: {
    extensions: ["*", ".js", ".jsx"],
  },
  entry: {
    index: "./src/index.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./index.html"),
    }),
    new ModuleFederationPlugin({
      name: "rulePreview",
      filename: "rulePreview.js",
      exposes: {},
      shared: [{ react: { singleton: true, requiredVersion: deps.react } }, { "react-dom": { singleton: true, requiredVersion: deps["react-dom"] } }],
    }),
  ],
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  devServer: {
    contentBase: `${rootFolder || ""}/dist`,
    index: `${rootFolder || ""}/dist/index.html`,
    host: `${betaEnv}.foo.redhat.com`,
    port: 8080,
    https: true,
    inline: true,
    disableHostCheck: true,
    historyApiFallback: true,
    writeToDisk: true,
    proxy: [
      {
        context: (path) => {
          const shouldRewrite = path.includes("/apps/")
          if (shouldRewrite) {
            console.log(`Rewriting URL ${path} to ${target}${path}`)
          }
          return shouldRewrite
        },
        target,
        secure: false,
        changeOrigin: true,
        autoRewrite: true,
        ws: true,
      },
    ],
  },
}
