
import * as BABYLON from 'babylonjs';
import convertValuesToHeatmap from "./helpers/ValuesToHeatmap";
import { DataPoint, TimeDataSet } from './interfaces/store';

import { SensorManager } from "./sensorManager";

export class heatmapTest{

    private _heatmapMesh1: BABYLON.Mesh;
    private _heatmapMesh2: BABYLON.Mesh;
    private _gageGroupShown: string;

    public scene: BABYLON.Scene;

    constructor(){
        this._gageGroupShown = "accelerometers";
        this._createHeatmapShapes();
    }

    private _createHeatmapShapes(){

        var positions = [
            -4, 0, 4,
            4, 0, 4,
            4, 0, -4,
            -4, 0, -4,
            -3, 0, 1,
            -1, 0, 1,
            -1, 0, -1,
            -3, 0, -1,
            -2.5, 1, 0.5,
            -1.5, 1, 0.5,
            -1.5, 1, -0.5,
            -2.5, 1, -0.5,
            1, 0, 1,
            3, 0, 1,
            3, 0, -1,
            1, 0, -1,
            2, 1.5, 0,
            -3, 0, 4,
            -1, 0, 4,
            1, 0, 4,
            3, 0, 4,
            3, 0, -4,
            1, 0, -4,
            -1, 0, -4,
            -3, 0, -4
        ];
    
        var indices = [
            9, 8, 10,
            8, 11, 10,
            8, 4, 11,
            11, 4, 7,
            8, 5, 4,
            8, 9, 5,
            9, 10, 5,
            10, 6, 5,
            10, 7, 6,
            10, 11, 7,
            16, 12, 15,
            16, 13, 12,
            16, 14, 13,
            16, 15, 14,
            4, 18, 17,
            4, 5, 18,
            5, 19, 18,
            5, 12, 19,
            5, 6, 15,
            5, 15, 12,
            12, 20, 19, 
            12, 13, 20,
            13, 1, 20,
            13, 2, 1,
            13, 14, 2,
            14, 21, 2,
            14, 22, 21,
            14, 15, 22,
            15, 23, 22,
            15, 6, 23, 
            6, 24, 23,
            7, 24, 6,
            7, 3, 24, 
            7, 0, 3,
            7, 4, 0,
            4, 17, 0
        ];
    

        const position1 = {
            x: -1000,
            y: 200,
            z: 105
        }

        //take uv value relative to bottom left corner of roof (-4, -4) noting length and width of roof is 8
        // base uv value on the x, z coordinates only
        var uvs = [];
        for(var p = 0; p < positions.length / 3; p++) {
            uvs.push((positions[3 * p] - (-4)) / 8, (positions[3 * p + 2] - (-4)) / 8);
        }
    
        var customMesh1 = new BABYLON.Mesh("testHeatmap1", this.scene);

        var normals: any[] = [];
    
        //Calculations of normals added
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    
        var vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals; //Assignment of normal to vertexData added
        vertexData.uvs = uvs;
    
        vertexData.applyToMesh(customMesh1);
        customMesh1.convertToFlatShadedMesh();

        this._heatmapMesh1 = customMesh1;
        this._heatmapMesh1.position = new BABYLON.Vector3(position1.x, position1.y, position1.z);
        this._heatmapMesh1.renderingGroupId = 2;       
        this._heatmapMesh1.scaling.copyFromFloats(25, 25, 25);    

        this._heatmapMesh1.freezeWorldMatrix();

        const position2 = {
            x: -1400,
            y: 200,
            z: 105
        }

        this._heatmapMesh2 = BABYLON.MeshBuilder.CreateCylinder("cone", {height: 200, diameterTop: 100, diameterBottom: 200,  }, this.scene);
        this._heatmapMesh2.position = new BABYLON.Vector3(position2.x, position2.y, position2.z);
        this._heatmapMesh2.renderingGroupId = 2;      
        this._heatmapMesh2.freezeWorldMatrix();

        this.updateHeatmaps();
    }

    public updateHeatmaps(){

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

        this._heatmapMesh1.material?.dispose();
        this._heatmapMesh2.material?.dispose();

        const multiplier = 5;
        let testLength = heatmapLength*multiplier;
        let testWidth = heatmapWidth*multiplier;
        let testData = [];

        for(let i = 0; i < multiplier * multiplier; i++){
            testData.push(...textureData);
        }

        let texture = new BABYLON.RawTexture(
            //Uint8Array.from(testData),
            new Uint8Array(testData),
            testLength,
            testWidth,
            BABYLON.Engine.TEXTUREFORMAT_RGB,
            this.scene,
            false,
            false,
            BABYLON.Texture.TRILINEAR_SAMPLINGMODE
        );

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

        let heatmapMaterial = new BABYLON.StandardMaterial("testHeatmap1Material", this.scene);
        // heatmapMaterial.diffuseTexture = texture;
        heatmapMaterial.emissiveTexture = texture;
        heatmapMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        //let animation = new BABYLON.Animation("heatmapAnimation", "material.texture", 30, BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

        heatmapMaterial.disableLighting = true;
        this._heatmapMesh1.material = heatmapMaterial;
        this._heatmapMesh2.material = heatmapMaterial;
    }
}