import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { _ThinInstanceDataStorage } from "babylonjs/Meshes/mesh";
import * as earcut from 'earcut';
(window as any).earcut = earcut;
import { api } from "./api/api";
import convertValuesToHeatmap from "./helpers/ValuesToHeatmap";
import { SensorInfo } from "./interfaces/sensorInfo";
import * as GUI from "babylonjs-gui";
import { DateTime } from "luxon";

export class Environment{

    private _scene: BABYLON.Scene;
    private _bridgeMeshes: BABYLON.AbstractMesh[];

    public deckMesh: BABYLON.Mesh;
    public sensorsMeshes: BABYLON.Mesh[];
    public sensorLabelsVisible: boolean;

    constructor(scene: BABYLON.Scene) {
        this.sensorsMeshes = [];
        this._scene = scene;       
    }

    public async load() {
        await this._loadAssets();
    }
    
    private async _loadAssets() {
        this._createSkyBox();
        this._createLights();
        await this._createTerrain();
        await this._createBridge();
        this._createHeatmapPlane();        
    }

    public updateHeatmap(){

        // this._updateSensorDataDisplay();

        const timeSliderValue = (document.getElementById("timeSelect") as HTMLInputElement).value;
        const time = window.store.timesShown[timeSliderValue];
        const dateTimeSelected = DateTime.fromISO(time);

        // const textureOrderedSensors = window.store.sensors.map((s: SensorInfo) => ({...s})).sort((a: SensorInfo, b: SensorInfo) => a.textureOrder - b.textureOrder);

        // let textureData: any[] = [];

        // textureOrderedSensors.map((s: SensorInfo) => {
        //     const data = s.data.find((d: SensorData) => d.datetime.equals(dateTimeSelected));
        //     try{
        //         textureData.push(...convertValuesToHeatmap(0, 100, data !== undefined ? data.value : 0));
        //     } catch (e) {
        //         console.error(e);
        //     }
        // });
        
        // this._environment.deckMesh.material?.dispose();

        // let texture = new BABYLON.RawTexture(
        //     new Uint8Array(textureData),
        //     4,
        //     2,
        //     BABYLON.Engine.TEXTUREFORMAT_RGB,
        //     this._scene,
        //     false,
        //     false,
        //     BABYLON.Texture.TRILINEAR_SAMPLINGMODE
        // );

        // let heatmapMaterial = new BABYLON.StandardMaterial("heatmapMaterial", this._scene);
        // heatmapMaterial.diffuseTexture = texture;
        // heatmapMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        // //let animation = new BABYLON.Animation("heatmapAnimation", "material.texture", 30, BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

        // this.deckMesh.material = heatmapMaterial;
        // this.adjustDeckHeatmapAlpha();
    }

    public adjustDeckHeatmapAlpha(){
        const show = (document.getElementById("showHeatmap") as HTMLInputElement).checked ? 1 : 0;
        const alphaValue = parseFloat((document.getElementById("heatmapOpacity") as HTMLInputElement).value);
        this.deckMesh.material.alpha = Math.min(show, alphaValue);
    }

    private async _createBridge(){
        const bridgeImport = await BABYLON.SceneLoader.ImportMeshAsync(null, "../models/McFarlandBridge/", "McFarland Bridge.gltf", this._scene,
        e => console.log("Loading Bridge..." + Math.trunc((e.loaded / e.total) * 100) + "%"));

        let bridgeMaterial = new BABYLON.StandardMaterial("bridgeSurface", this._scene);
        bridgeMaterial.diffuseColor = new BABYLON.Color3(.617, .105, .195);

        bridgeImport.meshes.forEach(m => {
            m.receiveShadows = true;
            m.checkCollisions = true;
            m.renderingGroupId = 2;
        });

        bridgeMaterial.freeze();
        bridgeImport.meshes[1].material = bridgeMaterial;

        this._bridgeMeshes = bridgeImport.meshes;     

        let bridgeMesh = bridgeImport.meshes[0] as BABYLON.Mesh;
        bridgeMesh.scaling.copyFromFloats(0.3, 0.3, 0.3);
        
        bridgeMesh.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(83.8), 0);
        bridgeMesh.position = new BABYLON.Vector3(-80, -50, 105);
    }

    private async _createTerrain(){
        const terrainImport = await BABYLON.SceneLoader.ImportMeshAsync(null, "../models/scene/terrain/", "BridgeTerrainBuildings.gltf", this._scene,
        e => console.log("Loading Scene..." + Math.trunc((e.loaded / e.total) * 100) + "%"));

        let sceneMaterial = new BABYLON.StandardMaterial("scene", this._scene);
        sceneMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);

        let sceneMesh = terrainImport.meshes[0] as BABYLON.Mesh;
        sceneMesh.scaling.copyFromFloats(12, 12, 12);

        terrainImport.meshes.forEach(mesh => {
            mesh.renderingGroupId = 2;
        });

        sceneMaterial.freeze();
        sceneMesh.material = sceneMaterial;
        sceneMesh.freezeWorldMatrix();
    }
    
    private _createHeatmapPlane(){
        const bridgeMesh = this._bridgeMeshes[0];
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

        const staticDeck = new BABYLON.PolygonMeshBuilder("heatmapBasePoly", polyCorners, this._scene, earcut.default);
        this.deckMesh = staticDeck.build();
        this.deckMesh.position = new BABYLON.Vector3(bridgeMesh.position.x - deckXoffset, bridgeMesh.position.y - deckYoffset, bridgeMesh.position.z - deckZoffset);
        this.deckMesh.renderingGroupId = 2;
        this.deckMesh.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(14), 0);

        const deck = new BABYLON.PolygonMeshBuilder("heatmapPoly", polyCorners, this._scene, earcut.default);
        this.deckMesh = deck.build();
        this.deckMesh.position = new BABYLON.Vector3(bridgeMesh.position.x - deckXoffset, bridgeMesh.position.y - deckYoffset, bridgeMesh.position.z - deckZoffset);
        this.deckMesh.renderingGroupId = 2;           
        this.deckMesh.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(14), 0);

        this.deckMesh.freezeWorldMatrix();
    }

    private _createLights(){
        let light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this._scene);
    }

    private _createSkyBox(){
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 1000}, this._scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("img/sky3/skybox", this._scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.position = this._scene.activeCamera.position;
        skyboxMaterial.freeze();
        skybox.material = skyboxMaterial;
    }
}