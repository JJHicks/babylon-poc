export interface SensorInfo {
    id: string,
    name: string,
    position: SensorPosition,
    data: SensorData[]
}

interface SensorPosition {
    x: number,
    y: number,
    z: number
}

interface SensorData {
    datetime: Date,
    value: number
}