"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const axios_1 = __importDefault(require("axios"));
const instance = axios_1.default.create({
    baseURL: "https://25cc1670-b78b-4e88-80b5-2d4b10018a00.mock.pstmn.io/",
    timeout: 15000
});
const responseBody = (response) => response.data;
exports.api = {
    getSensorData: () => instance.get("/data").then(responseBody)
};
//# sourceMappingURL=api.js.map