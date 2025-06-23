const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production', 
  entry: {
    popup: './src/popup/index.js',
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
          transform(content) {
            // Ensure background is configured correctly for ES modules
            const manifest = JSON.parse(content.toString());
            if (manifest.manifest_version === 3) {
              manifest.background = {
                ...manifest.background,
                type: 'module' // Enable ES modules for service worker
              };
            }
            return JSON.stringify(manifest, null, 2);
          }
        },
        { from: 'src/assets', to: 'assets' }
      ],
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  optimization: {
    minimize: false, // Avoid minification issues with service workers
    moduleIds: 'named',
    chunkIds: 'named',
    // Configure specific optimization for different script types
    splitChunks: {
      cacheGroups: {
        // Keep background script self-contained
        backgroundVendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'background-vendor',
          chunks: chunk => chunk.name === 'background',
          enforce: true
        },
        // Keep content script self-contained
        contentVendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'content-vendor',
          chunks: chunk => chunk.name === 'content',
          enforce: true
        },
        // Main popup vendor bundle
        popupVendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'popup-vendor',
          chunks: chunk => chunk.name === 'popup',
          enforce: true
        }
      }
    },
    // Avoid wrapper functions that cause issues in service workers
    concatenateModules: false
  },
  devtool: false
};
