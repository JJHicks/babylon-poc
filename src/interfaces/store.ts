import { SensorInfo } from "./sensorInfo";
import { DateTime } from "luxon";

export interface Store {
    activeDataset: TimeDataSet,
    timeData: TimeDataSet[],
    timesShown: DateTime[]
}

export interface TimeDataSet{
    time: DateTime,
    data: Array<{
        id: string,
        value: number
    }>
}
