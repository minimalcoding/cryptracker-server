const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const nodeExternals = require('webpack-node-externals');
const R = require('ramda');

const $ = p => path.resolve(__dirname, '..', p);
process.chdir($('.'));

const config = {
    entry: $('./src/index.ts'),
    output: {
        filename: 'dev-bundle.js',
        path: $('./dist'),
    },
    devtool: "source-map",
    target: 'node',
    resolve: {
        extensions: [".ts", ".js", ".json"],
        alias: { "src": $("./src") },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'awesome-typescript-loader',
                },
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ["env", {
                                targets: {
                                    node: "current"
                                },
                                debug: true,
                            }],
                            ["stage-3"],
                        ],
                    },
                },
            },
        ],
    },
    externals: [nodeExternals()],
    plugins: [
        new webpack.BannerPlugin({
            banner: 'require("source-map-support").install();',
            raw: true,
            entryOnly: false,
        })
    ]
};

const compiler = webpack(config);
const watcher = compiler.watch({}, (err, stats) => {
    if (err) {
        console.error(err);
    } else {
        console.log(stats.toString('minimal'));
    }
});