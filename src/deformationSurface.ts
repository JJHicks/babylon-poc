
import { FloatArray } from '@babylonjs/core/types';
import * as BABYLON from 'babylonjs';
import convertValuesToHeatmap from './helpers/ValuesToHeatmap';
import { DataPoint, TimeDataSet } from './interfaces/store';

import { SensorManager } from "./sensorManager";

export class DeformationSurface{

    private _surfaceMesh: BABYLON.Mesh;
    private _pathArray: BABYLON.Vector3[][];
    private _yLevel: number;
    private _rows: number;
    private _columns: number;

    public scene: BABYLON.Scene;
    public verticalDeformationScale: number;

    constructor(rows: number, cols: number){
        this._rows = rows;
        this._columns = cols;
        this.verticalDeformationScale = 30;
        this._createSurfacePlane();
    }

    private _createSurfacePlane(){

        const position = {
            x: -80,
            y: -50,
            z: 105
        }

        // const deckSkew = 165;
        // const deckWidth = 900;
        // const deckHeight = 450; 

        // const polyCorners = [
        //     new BABYLON.Vector2(0 + deckSkew, 0),
        //     new BABYLON.Vector2(deckWidth + deckSkew, 0),
        //     new BABYLON.Vector2(deckWidth, deckHeight),
        //     new BABYLON.Vector2(0, deckHeight)
        // ];

        // const deckXoffset = 570;
        // const deckYoffset = 73;
        // const deckZoffset = 90

        // const deck = new BABYLON.PolygonMeshBuilder("deformationSurfacePoly", polyCorners, this.scene, window.earcut.default);
        // this._surfaceMesh = deck.build();
        // this._surfaceMesh.position = new BABYLON.Vector3(position.x - deckXoffset, position.y - deckYoffset, position.z - deckZoffset);
        // this._surfaceMesh.renderingGroupId = 2;           
        // this._surfaceMesh.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(14), 0);

        const deckXoffset = -350;
        const deckYoffset = 200;
        const deckZoffset = 90

        var sideO = BABYLON.Mesh.BACKSIDE;
        this._pathArray = [];
        
        const cols = this._columns;
        const colSpacing = 200;
        const rows = this._rows;
        const rowSpacing = 150;

        this._yLevel = position.y + deckYoffset;

        for(var i = 0; i < rows; i++) {
            this._pathArray.push([]);
            for (var j = 0; j < cols; j++) {
                var x = i * rowSpacing;
                var y = this._yLevel;
                var z = j * colSpacing;
                this._pathArray[i].push(new BABYLON.Vector3(x, y, z));
            }
        }

        const pathLines = BABYLON.MeshBuilder.CreateLineSystem("deformationPaths", {lines: this._pathArray}, this.scene);
        pathLines.color = BABYLON.Color3.Green();
        pathLines.position = new BABYLON.Vector3(position.x + deckXoffset, this._yLevel, position.z + deckZoffset);        
        pathLines.renderingGroupId = 2;        
        pathLines.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(14), 0);

        console.debug(this._pathArray);

        this._surfaceMesh = BABYLON.Mesh.CreateRibbon("ribbon", this._pathArray, false, false, 0, this.scene, true, sideO);
        this._surfaceMesh.position = new BABYLON.Vector3(position.x + deckXoffset, this._yLevel, position.z + deckZoffset);
        this._surfaceMesh.renderingGroupId = 2;        
        this._surfaceMesh.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(14), 0);

        this.updateSurface();
    }

    public updateSurface(){

        const heatmapLength = this._columns;
        const heatmapWidth = this._rows;

        let textureData: number[] = [];
        let yDeformation: number[][] = [];

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

        const normalize = function(val: number, max: number, min: number): number { return (val - min) / (max - min); }

        for(let i = 0; i < heatmapWidth; i++){
            yDeformation.push([]);
        }

        for(let i = 0; i < heatmapLength*heatmapWidth; i++){
            const datapoint = sensorsToShow.find(s => s.sector === i);
            const value = datapoint !== undefined ? datapoint.value : 0;
            console.debug(value);
            yDeformation[i % heatmapWidth].push(normalize(100 - value, 0, 100));

            try{
                textureData.push(...convertValuesToHeatmap(0, 100, value));
            } catch (e) {
                console.error(e);
            }
        }

        console.debug(yDeformation);

        for(var p = 0; p < this._pathArray.length; p++) {
            for (var i = 0; i < this._pathArray[p].length; i++) {
                var x = this._pathArray[p][i].x;
                var z = this._pathArray[p][i].z;
                // var y = 20 * Math.sin(i/ 10);
                // var z = path[i].z + ((Math.random() / 10) - .01);
                // var y = this._yLevel - (Math.random() * this.verticalDeformationScale);
                var y = this._yLevel - (yDeformation[p][i] * this.verticalDeformationScale);
                this._pathArray[p][i].x = x;
                this._pathArray[p][i].y = y;
                this._pathArray[p][i].z = z;
            }
        }

        this._surfaceMesh = BABYLON.MeshBuilder.CreateRibbon(null, {pathArray: this._pathArray, instance: this._surfaceMesh});

        this._surfaceMesh.material?.dispose();

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

        let deformationMaterial = new BABYLON.StandardMaterial("deformationMaterial", this.scene);
        // deformationMaterial.diffuseTexture = texture;
        deformationMaterial.emissiveTexture = texture;
        deformationMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        deformationMaterial.backFaceCulling = false;
        this._surfaceMesh.material = deformationMaterial;
        
        // this._surfaceMesh.updateMeshPositions(p => this._positionFunction(p), true);
    }

    // private _positionFunction = function(positions: FloatArray) {
    //     // modify positions array values here
    //     console.debug(positions);

    //     for(let i = 1; i < positions.length; i += 1){
    //         let pos = (Math.random() * 200) + 10;
    //         positions[i] = pos;
    //     }
    // };

}