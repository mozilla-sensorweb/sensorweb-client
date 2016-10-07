var CleanWebpackPlugin = require('clean-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: [
    'babel-polyfill',
    './src/index'
  ],
  output: {
    path: './www',
    filename: 'sensorweb.out.js',
  },
  resolve: {
    extensions: ['', '.ts', '.tsx', '.js', '.jsx', '.css']
  },
  devtool: 'source-map',
  module: {
    loaders: [
      // note that babel-loader is configured to run after ts-loader
      { test: /\.ts(x?)$/, loader: 'babel-loader!ts-loader' },
      { test: /\.css$/,
        loader: ExtractTextPlugin.extract('style-loader', ['css-loader', 'postcss-loader'])
      },
      { test: /\.(eot|svg|ttf|woff|woff2|png|jpg)$/,
        loader: 'url-loader?limit=10000'
      }
    ],
    preLoaders: [
      { test: /\.js$/, loader: "source-map-loader" }
    ],
  },
  postcss: function(webpack) {
    return [
      require('postcss-cssnext')(),
      require('postcss-nesting')()
    ];
  },
  plugins: [
    new CleanWebpackPlugin(['www']),
    new ExtractTextPlugin('sensorweb.out.css')
  ]
};