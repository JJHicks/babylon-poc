import * as BABYLON from "babylonjs";
import { SensorMetadata } from "../interfaces/sensorMetadata";

export class SensorObject{

    public metaData: SensorMetadata
    public primaryColor: [Number, Number, Number]; 
    public mesh: BABYLON.Mesh;
    public labelMesh?: BABYLON.Mesh;

    constructor(metaData: SensorMetadata){
        this.metaData = metaData;
    }

}