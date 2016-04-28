import Webpack from 'webpack';
import path from 'path';

const GLOBALS = {
	'process.env.NODE_ENV': JSON.stringify('development'),
	__DEV__: true
};

export default {
	debug: true,
	devtool: 'cheap-module-eval-source-map',
	target: 'web',
	entry: [
		'webpack-hot-middleware/client?reload=true',
		'./src/index'
	],
	output: {
		path: __dirname + '/dist',
		publicPath: '/',
		filename: 'bundle.js'
	},
	plugins: [
		new Webpack.DefinePlugin(GLOBALS),
		new Webpack.HotModuleReplacementPlugin(),
		new Webpack.NoErrorsPlugin()
	],
	module: {
		loaders: [
			{ test: /\.jsx?$/,
			  include: path.join(__dirname, 'src'),
			  loaders: ['babel', 'eslint'] },
		]
	}
}
