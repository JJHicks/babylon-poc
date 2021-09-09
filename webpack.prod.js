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
        index: path.resolve(appDirectory, "app.ts")
    },
    output: {
        path: path.resolve(appDirectory, "../build"),
        filename: "js/bundle.js", 
        // publicPath: "/"
    },
    mode: "production",
    devtool: false,
    module: {
        rules: [
            {
                test: /\.css$/,
                type: "asset/source",
                use: [MiniCssExtractPlugin.loader, "css-loader"]
                // use: [ 
                //     {
                //         loader: MiniCssExtractPlugin.loader,
                //         options: {
                //             publicPath: (resourcePath, context) => {
                //                 return path.relative(path.dirname(resourcePath), context) + "/build"
                //             }
                //         }
                //     }, 
                //     "css-loader"
                // ]
            },
            {
                test: /\.tsx?$/,
                //use: "ts-loader",
                exclude: /node_modules/,
                // options: {
                //     configFile: "tsconfig.prod.json"
                // }
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
                test: /\.(sa|sc|c)ss$/,
                exclude: /node_modules/,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
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
            //filename: "index.html",
            title: "Bridge",
            //template: path.resolve(appDirectory, "./index.html"),
            template: "../index.html",
            // publicPath: "/"
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        })
    ]
})