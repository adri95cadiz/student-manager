const rules = require('./webpack.rules');

// La regla CSS ya está definida en webpack.rules.js, la eliminamos de aquí.
// rules.push({
//   test: /\.css$/,
//   use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
// });

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.css', '.node'],
  },
};
