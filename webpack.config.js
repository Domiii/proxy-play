const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');


const config = {
  entry: './src/index.js',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new LodashModuleReplacementPlugin
  ],
  externals: [
    nodeExternals({})
  ]
};

module.exports = config;