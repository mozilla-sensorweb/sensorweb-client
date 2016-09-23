module.exports = {  
  entry: [
    './www/src/index'
  ],
  output: {
    path: './www/',
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
      { test: /\.css$/, loader: "style-loader!css-loader!postcss-loader" }
    ],
    preLoaders: [
      { test: /\.js$/, loader: "source-map-loader" }
    ],
  },
  postcss: function() {
    return [require('postcss-cssnext')];
  }
};