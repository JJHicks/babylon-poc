import { SensorInfo } from "./sensorInfo";
import { DateTime } from "luxon";

export interface Store {
    sensors: SensorInfo[]
    timesShown: DateTime[]
}
