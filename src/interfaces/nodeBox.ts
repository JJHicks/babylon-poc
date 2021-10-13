import { SensorPosition } from "./sensorInfo";

export interface NodeBox {
    id: string,
    position: SensorPosition,
    channelQty: number
}