const path = require("path");
const fs = require("fs");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            // {
            //     test: /\.tsx?$/,
            //     use: "ts-loader",
            //     exclude: /node_modules/,
            // },
            {
                test: /\.js$/,
                type: "javascript/auto",
                enforce: "pre",
                use: ["source-map-loader"],
            },
        ],
    }
};