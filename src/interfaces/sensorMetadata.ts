import { SensorPosition } from "./sensorInfo";

export interface SensorMetadata {
    id: string,
    position: SensorPosition,
    QTYTakeOff: number,
    channelQTY: number,
    auxBox: string,
    mappedTo: string,
    textureOrder?: number
}