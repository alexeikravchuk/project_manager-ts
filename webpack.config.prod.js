import * as path from 'path';
// import HtmlWebpackPlugin from 'html-webpack-plugin';
import CleanPlugin from 'clean-webpack-plugin';

export default {
	mode: 'production',
	entry: './src/app.ts',
	output: {
		filename: 'bundle.js',
		path: path.resolve('dist'),
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			/*{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: 'asset/resource',
			},*/
		],

	},
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
	resolve: {
		extensions: ['.ts', '.js'],
	},
	plugins: [
		new CleanPlugin.CleanWebpackPlugin(),
		/*new HtmlWebpackPlugin({
			title: 'ProjectManager',
			template: path.resolve('./src/index.html'),
		}),*/
	],

};
