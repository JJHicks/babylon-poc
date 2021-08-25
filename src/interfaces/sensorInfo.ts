import { DateTime } from "luxon";

export interface SensorInfo {
    id: string,
    name: string,
    position: SensorPosition,
    data: SensorData[],
    textureOrder: number
}

interface SensorPosition {
    x: number,
    y: number,
    z: number
}

export interface SensorData {
    datetime: DateTime,
    value: number
}