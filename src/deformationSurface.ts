
import * as BABYLON from 'babylonjs';
import { DataPoint, TimeDataSet } from './interfaces/store';

import { SensorManager } from "./sensorManager";

export class DeformationSurface{

    private _surfaceMesh: BABYLON.Mesh;

    public scene: BABYLON.Scene;

    constructor(){
        this._createSurfacePlane();
    }

    private _createSurfacePlane(){

        const position = {
            x: -80,
            y: 400,
            z: 105
        }

        const deckSkew = 165;
        const deckWidth = 900;
        const deckHeight = 450; 
        const polyCorners = [
            new BABYLON.Vector2(0 + deckSkew, 0),
            new BABYLON.Vector2(deckWidth + deckSkew, 0),
            new BABYLON.Vector2(deckWidth, deckHeight),
            new BABYLON.Vector2(0, deckHeight)
        ];

        const deckXoffset = 570;
        const deckYoffset = 73;
        const deckZoffset = 90

        const deck = new BABYLON.PolygonMeshBuilder("deformationSurfacePoly", polyCorners, this.scene, window.earcut.default);
        this._surfaceMesh = deck.build();
        this._surfaceMesh.position = new BABYLON.Vector3(position.x - deckXoffset, position.y - deckYoffset, position.z - deckZoffset);
        this._surfaceMesh.renderingGroupId = 2;           
        this._surfaceMesh.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(14), 0);
    }

    public updateSurface(){

        // const heatmapLength = 5;
        // const heatmapWidth = 3;

        // let textureData: number[] = [];

        // const sensorManager = SensorManager.getInstance();
        // const selectedGroup = (document.getElementById("heatmapDatasetSelect") as HTMLInputElement).value;

        // const sensorsToShow = sensorManager.getGageGroup(selectedGroup).map(o => {
        //     const datapoint = window.store.activeDataset.data.find((dp: DataPoint) => dp.id === o.metaData.id)

        //     return {
        //         id: o.metaData.id,
        //         sector: o.metaData.heatmapSector,
        //         value: datapoint !== undefined ? datapoint.value : 0
        //     }
        // });

        // for(let i = 0; i < heatmapLength*heatmapWidth; i++){
        //     const datapoint = sensorsToShow.find(s => s.sector === i);
        //     try{
        //         textureData.push(...convertValuesToHeatmap(0, 100, datapoint !== undefined ? datapoint.value : 0));
        //     } catch (e) {
        //         console.error(e);
        //     }
        // }

        // this._heatmapMesh.material?.dispose();

        // let texture = new BABYLON.RawTexture(
        //     new Uint8Array(textureData),
        //     heatmapLength,
        //     heatmapWidth,
        //     BABYLON.Engine.TEXTUREFORMAT_RGB,
        //     this.scene,
        //     false,
        //     false,
        //     BABYLON.Texture.TRILINEAR_SAMPLINGMODE
        // );

        // let heatmapMaterial = new BABYLON.StandardMaterial("heatmapMaterial", this.scene);
        // heatmapMaterial.diffuseTexture = texture;
        // heatmapMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        // this._heatmapMesh.material = heatmapMaterial;
    }
}