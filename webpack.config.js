const path = require("path");
const webpack = require("webpack")
const include = path.join(__dirname, 'src')
console.log(__dirname)
module.exports = {
    entry: './dist/networkViz',
    output: {
        path: path.join(__dirname, 'build'),
        libraryTarget: 'umd',
        library: 'networkVizJS',
        filename: 'networkviz.js',
    },
    devtool: 'inline-source-map',
    mode: 'development',
    resolve: {
        modules: [
            path.join(__dirname, 'node_modules')
        ]
    },
    externals: {
        // d3: 'd3',
        // webcola: 'cola'
    }
}
