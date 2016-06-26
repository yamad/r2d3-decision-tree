var Webpack = require('webpack');
var path = require('path');

var GLOBALS = {
	'process.env.NODE_ENV': JSON.stringify('development'),
	__DEV__: true
};

module.exports = {
	debug: true,
	devtool: 'cheap-module-eval-source-map',
	target: 'web',
	plugins: [
		new Webpack.DefinePlugin(GLOBALS),
	],
	module: {
		loaders: [
			{ test: /\.jsx?$/,
			  exclude: /node_modules/,
			  loaders: ['eslint', 'babel'] }
		]
	},
	node: {
		fs: 'empty'
	}
};
