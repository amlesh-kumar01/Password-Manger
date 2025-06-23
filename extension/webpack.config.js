const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    popup: './src/popup/index.js',
    // Change the background entry point to use back.js instead
    background: './src/background/index.js', 
    content: './src/content/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                modules: false // Preserve ES modules
              }], 
              '@babel/preset-react'
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup/index.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'src/manifest.json', 
          to: 'manifest.json',
        },
        { from: 'src/assets', to: 'assets' }
      ],
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  optimization: {
    minimize: false,
    moduleIds: 'named',
    chunkIds: 'named',
    // Disable code splitting specifically for background
    splitChunks: {
      cacheGroups: {
        // Remove background vendor splitting to keep background script simple
        contentVendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'content-vendor',
          chunks: chunk => chunk.name === 'content',
          enforce: true
        },
        popupVendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'popup-vendor',
          chunks: chunk => chunk.name === 'popup',
          enforce: true
        }
      }
    },
    concatenateModules: false
  },
  devtool: false
};
