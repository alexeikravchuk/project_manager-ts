import * as path from 'path';
// import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
	mode: 'development',
	entry: './src/app.ts',
	output: {
		filename: 'bundle.js',
		path: path.resolve('dist'),
		publicPath: 'dist',
	},
	devtool: 'inline-source-map',
	devServer: {
		static: {
			directory: '.',
		},
		devMiddleware: {
			index: true,
			// mimeTypes: { phtml: 'text/html' },
			writeToDisk: true,
		},
		hot: true,
		client: {
			overlay: false,
		},
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: 'asset/resource',
			},
		],

	},
	/*plugins: [
		new HtmlWebpackPlugin({
			title: 'ProjectManager',
			template: path.resolve('./src/index.html'),
		}),
	],*/
	resolve: {
		extensions: ['.ts', '.js'],
	},
};
