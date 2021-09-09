const { merge } = require("webpack-merge");
const fs = require("fs");
const path = require("path");
const common = require("./webpack.common.js");
const appDirectory = fs.realpathSync(process.cwd());

const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = merge(common, {
    entry: {
        index: path.resolve(appDirectory, "src/app.ts")
    },
    output: {
        path: path.resolve(appDirectory, "dist/js"),
        filename: "js/bundle.js", 
    },
    mode: "development",
    devtool: "inline-source-map",
    devServer: {
        host: "127.0.0.1",
        port: 8080,
        disableHostCheck: true,
        contentBase: path.resolve(appDirectory, "public"),
        publicPath: "/",
        hot: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                // use: "ts-loader",
                exclude: /node_modules/,
                // options: {
                //     configFile: "tsconfig.json"
                // }
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: "tsconfig.json"
                        }
                    }
                ]
            }
        ],
    },   
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            filename: "index.html",
            template: path.resolve(appDirectory, "public/index.html"),
        }),
        // new CleanWebpackPlugin({
        //     cleanOnceBeforeBuildPatterns: ["public/js/build/*","public/css/build/*"]
        // })
    ]
});