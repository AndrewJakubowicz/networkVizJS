const path = require("path");

const include = path.join(__dirname, 'src')

module.exports = {
    entry: './src/networkViz',
    output: {
        path: path.join(__dirname, 'dist'),
        libraryTarget: 'umd',
        library: 'networkVizJS',
    },
    devtool: 'source-map',
    module: {
    loaders: [
        {
            test: /\.js$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader',
            query: {
                presets: ['env']
            }
        }
        ]
    }
}