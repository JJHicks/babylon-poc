
import * as BABYLON from 'babylonjs';
import convertValuesToHeatmap from "./helpers/ValuesToHeatmap";
import { DataPoint, TimeDataSet } from './interfaces/store';

import { SensorManager } from "./sensorManager";

export class HeatmapManager{

    private static _instance: HeatmapManager;
    private _heatmapMesh: BABYLON.Mesh;
    private _gageGroupShown: string;

    public scene: BABYLON.Scene;

    private constructor(){
        this._gageGroupShown = "accelerometers";
    }

    static getInstance(){
        if(!HeatmapManager._instance){
            HeatmapManager._instance = new HeatmapManager();
            HeatmapManager._instance._createHeatmapPlane();
        }
        return HeatmapManager._instance;
    }

    private _createHeatmapPlane(){

        const position = {
            x: -80,
            y: -50,
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

        const deck = new BABYLON.PolygonMeshBuilder("heatmapPoly", polyCorners, this.scene, window.earcut.default);
        this._heatmapMesh = deck.build();
        this._heatmapMesh.position = new BABYLON.Vector3(position.x - deckXoffset, position.y - deckYoffset, position.z - deckZoffset);
        this._heatmapMesh.renderingGroupId = 2;           
        this._heatmapMesh.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(14), 0);

        this._heatmapMesh.freezeWorldMatrix();
    }

    public updateHeatmap(){

        const heatmapLength = 5;
        const heatmapWidth = 3;

        let textureData: number[] = [];

        const sensorManager = SensorManager.getInstance();
        const selectedGroup = (document.getElementById("heatmapDatasetSelect") as HTMLInputElement).value;

        const sensorsToShow = sensorManager.getGageGroup(selectedGroup).map(o => {
            const datapoint = window.store.activeDataset.data.find((dp: DataPoint) => dp.id === o.metaData.id)

            return {
                id: o.metaData.id,
                sector: o.metaData.heatmapSector,
                value: datapoint !== undefined ? datapoint.value : 0
            }
        });

        for(let i = 0; i < heatmapLength*heatmapWidth; i++){
            const datapoint = sensorsToShow.find(s => s.sector === i);
            try{
                textureData.push(...convertValuesToHeatmap(0, 100, datapoint !== undefined ? datapoint.value : 0));
            } catch (e) {
                console.error(e);
            }
        }

        this._heatmapMesh.material?.dispose();

        // const multiplier = 5;
        // let testLength = heatmapLength*multiplier;
        // let testWidth = heatmapWidth*multiplier;
        // let testData = [];

        // for(let i = 0; i < multiplier * multiplier; i++){
        //     testData.push(...textureData);
        // }

        // let texture = new BABYLON.RawTexture(
        //     //Uint8Array.from(testData),
        //     new Uint8Array(testData),
        //     testLength,
        //     testWidth,
        //     BABYLON.Engine.TEXTUREFORMAT_RGB,
        //     this.scene,
        //     false,
        //     false,
        //     BABYLON.Texture.TRILINEAR_SAMPLINGMODE
        // );

        let texture = new BABYLON.RawTexture(
            new Uint8Array(textureData),
            heatmapLength,
            heatmapWidth,
            BABYLON.Engine.TEXTUREFORMAT_RGB,
            this.scene,
            false,
            false,
            BABYLON.Texture.TRILINEAR_SAMPLINGMODE
        );

        let heatmapMaterial = new BABYLON.StandardMaterial("heatmapMaterial", this.scene);
        heatmapMaterial.diffuseTexture = texture;
        heatmapMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        //let animation = new BABYLON.Animation("heatmapAnimation", "material.texture", 30, BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

        this._heatmapMesh.material = heatmapMaterial;
        this.adjustDeckHeatmapAlpha();
    }

    public adjustDeckHeatmapAlpha(){
        const show = (document.getElementById("showHeatmap") as HTMLInputElement).checked ? 1 : 0;
        const alphaValue = parseFloat((document.getElementById("heatmapOpacity") as HTMLInputElement).value);
        this._heatmapMesh.material.alpha = Math.min(show, alphaValue);
    }
}