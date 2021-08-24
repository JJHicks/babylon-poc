import { SensorInfo } from "./sensorInfo";

export interface Store {
    sensors: SensorInfo[]
    timesShown: Date[]
}
