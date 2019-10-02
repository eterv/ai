const path = require('path');

module.exports = {
	mode: 'development',
	//mode: 'production',
	//devtool : 'source-map', // 소스맵 추가

	entry: {
		ai: './src/ai.js'
	},
	module: {
		rules: [
			/*{
				test: /\.css$/,
				use: [ 'css-loader' ]
			},*/
			{
				test: /\.jsx?$/,
				use: {
					loader: "babel-loader",
				},
				exclude: /node_modules/,
			}
		],
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, '../arakny/www/a-content/base/assets/ai'),
		//libraryTarget: "var"
	}
};