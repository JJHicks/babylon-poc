const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserJSPlugin = require('terser-webpack-plugin');
const path = require("path");
const fs = require("fs");
const appDirectory = fs.realpathSync(process.cwd());

module.exports = merge(common, {
    entry: {
        // index: path.resolve(appDirectory, "app.ts")
        
        index: [path.resolve(appDirectory, "app.ts"), path.resolve(appDirectory, "scss/style.scss")]
    },
    output: {
        path: path.resolve(appDirectory, "../share/nginx/html"),
        filename: "js/bundle.js", 
    },
    mode: "production",
    devtool: false,
    module: {
        rules: [
            {
                test: /\.css$/,
                type: "asset/source",
                use: [MiniCssExtractPlugin.loader, "css-loader"]
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: "tsconfig.prod.json"
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            // minimize: true,
                            sourceMap: true
                        }
                    },
                    "sass-loader"
                ]
            }
        ]
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                styles: {
                    name: "styles",
                    type: "css/mini-extract",
                    chunks: "all",
                    enforce: true
                }
            }
        },
        minimize: true,
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserJSPlugin()
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            title: "Bridge",
            template: "index.html"
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        })
    ]
})