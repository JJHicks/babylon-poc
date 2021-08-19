export interface SensorDataResponse {
    sensors : SensorData[];
}

interface SensorData {
    id: string;
    reading: number;
}