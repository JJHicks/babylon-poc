import axios, { AxiosResponse } from "axios";
import { SensorDataResponse } from "../models/SensorDataResponse.interface";

const instance = axios.create({
    baseURL: "https://25cc1670-b78b-4e88-80b5-2d4b10018a00.mock.pstmn.io/", 
    timeout: 15000
});

const responseBody = (response: AxiosResponse) => response.data;

export const api = {
    getSensorData: (): Promise<SensorDataResponse> => instance.get("/data").then(responseBody)
}