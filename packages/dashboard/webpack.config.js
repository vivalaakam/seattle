const path = require('path');
const Dotenv = require('dotenv-webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

const { NODE_ENV = 'development', WEBPACK_PORT = 3001 } = process.env;
const __DEV__ = NODE_ENV === 'development';

const config = {
  entry: './frontend/index.tsx',
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
              plugins: [
                ['@babel/transform-runtime']
              ]
            },
          },
        ],
      },
      {
        test: /\.s?css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: __DEV__,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: __DEV__,
            },
          },
        ],
      },
      {
        test: /\.(jpg|png|gif|woff|woff2|eot|ttf|svg)$/,
        use: [{ loader: 'file-loader' }],
      },
    ],
  },
  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({
      custom: __DEV__ ? process.env.REMOTE ?? '/' : '{{publicHost}}',
      template: 'public/index.html',
    }),
    new MiniCssExtractPlugin({ filename: __DEV__ ? 'styles.css' : 'styles-[contenthash].css' }),
    !__DEV__ && new CompressionPlugin(),
  ].filter(Boolean),
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist/public'),
    filename: 'bundle.js',
  },
  devServer: {
    static: path.join(__dirname, 'dist/public'),
    compress: true,
    port: WEBPACK_PORT,
    historyApiFallback: true,
  },

  devtool: __DEV__ ? 'eval-source-map' : 'source-map',
  mode: __DEV__ ? 'development' : 'production',
};

module.exports = config;
