import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import * as earcut from 'earcut';
(window as any).earcut = earcut;
import { api } from "./api/api";
import convertValuesToHeatmap from "./helpers/ValuesToHeatmap";
import { SensorInfo } from "./interfaces/sensorInfo";

export class Environment{

    private _scene: BABYLON.Scene;
    private _bridgeMeshes: BABYLON.AbstractMesh[];
    private _sensorLabels: BABYLON.Sprite[];

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

    public setAllSensorsVisible(visible: boolean){
        const group = visible ? 3 : 2;
        this.sensorsMeshes.forEach(s => {
            s.renderingGroupId = group;
        });
    }

    public updateSensorLabels(data: any[]){
        //console.log(data);

        //Temp stuff
        const sensorData = data[0]; 
        const sensor = window.store.sensors.find((s: SensorInfo) => s.id === sensorData.id);

        //End temp stuff

        const text = sensor.name;
        const font = "bold 32px monospace";

        let labelTexture = new BABYLON.DynamicTexture("dynamic texture", {width:512, height:256}, this._scene, false);  
        //let labelTexture = new BABYLON.DynamicTexture("dynamic texture", {width:128, height:64}, this._scene, false);     

        // Change clearColor argument for background color, or set "transparent"
        labelTexture.drawText(text, null, null, font, "white", "transparent", true, true);

        let labelMaterial = new BABYLON.StandardMaterial("labelMaterial", this._scene);    				
        labelMaterial.emissiveColor = new BABYLON.Color3(255, 255, 255);
        labelMaterial.diffuseTexture = labelTexture;
        labelMaterial.diffuseTexture.hasAlpha = true;

        const labelWidth = this._measureTextWidth(text, font) + 10;
        const labelHeight = 150;   

        let label = BABYLON.MeshBuilder.CreatePlane("label1", {width: labelWidth, height: labelHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, this._scene);
        label.renderingGroupId = 2;

        //label.position = new BABYLON.Vector3(this.deckMesh.position.x + 400, this.deckMesh.position.y + 200, this.deckMesh.position.z);
        label.position = new BABYLON.Vector3(sensor.position.x, sensor.position.y + 50, sensor.position.z);

        label.material = labelMaterial;
        label.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        // Sprite
        //spm = new BABYLON.SpritePackedManager("spm", "textures/pack1.png", 40, this._scene);

        this.sensorLabelsVisible = true;
    }

    private _measureTextWidth(text: string, font: string){
        var temp = new BABYLON.DynamicTexture("TempDynamicTexture", {width:512, height:256}, this._scene, false);
        //var temp = new BABYLON.DynamicTexture("TempDynamicTexture", {width:128, height:64}, this._scene, false);;
        var tmpctx = temp.getContext();
        tmpctx.font = font;
        var DTWidth = tmpctx.measureText(text).width;
        temp.dispose();
        return DTWidth;
    }

    public clearSensorLabels(){
        
        this.sensorLabelsVisible = false;
    }

    private async _loadAssets() {
        this._createSkyBox();
        this._createLights();
        await this._createTerrain();
        await this._createBridge();
        this._createSensors();
        this._createHeatmapPlane();        
    }

    private async _createBridge(){
        const bridgeImport = await BABYLON.SceneLoader.ImportMeshAsync(null, "../models/McFarlandBridge/", "McFarland Bridge.gltf", this._scene,
        e => console.log("Loading Bridge..." + Math.trunc((e.loaded / e.total) * 100) + "%"));

        var bridgeMaterial = new BABYLON.StandardMaterial("bridgeSurface", this._scene);
        bridgeMaterial.diffuseColor = new BABYLON.Color3(.617, .105, .195);

        bridgeImport.meshes.forEach(m => {
            m.receiveShadows = true;
            m.checkCollisions = true;
            m.renderingGroupId = 2;
        });

        bridgeImport.meshes[1].material = bridgeMaterial;

        this._bridgeMeshes = bridgeImport.meshes;     

        var bridgeMesh = bridgeImport.meshes[0] as BABYLON.Mesh;
        bridgeMesh.scaling.copyFromFloats(0.3, 0.3, 0.3);
        
        bridgeMesh.rotation = new BABYLON.Vector3(0, 1.462586, 0);
        bridgeMesh.position = new BABYLON.Vector3(-80, -50, 105);
    }

    private async _createTerrain(){
        const terrainImport = await BABYLON.SceneLoader.ImportMeshAsync(null, "../models/scene/terrain/", "BridgeTerrainBuildings.gltf", this._scene,
        e => console.log("Loading Scene..." + Math.trunc((e.loaded / e.total) * 100) + "%"));

        var sceneMaterial = new BABYLON.StandardMaterial("scene", this._scene);
        sceneMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);

        var sceneMesh = terrainImport.meshes[0] as BABYLON.Mesh;
        sceneMesh.scaling.copyFromFloats(12, 12, 12);

        terrainImport.meshes.forEach(mesh => {
            mesh.renderingGroupId = 2;
        });

        sceneMesh.material = sceneMaterial;
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

        const staticDeck = new BABYLON.PolygonMeshBuilder("heatmapPoly", polyCorners, this._scene, earcut.default);
        this.deckMesh = staticDeck.build();
        this.deckMesh.position = new BABYLON.Vector3(bridgeMesh.position.x - deckXoffset, bridgeMesh.position.y - deckYoffset, bridgeMesh.position.z - deckZoffset);
        this.deckMesh.renderingGroupId = 2;
        this.deckMesh.rotation = new BABYLON.Vector3(0, 14 * (Math.PI/180), 0);

        const deck = new BABYLON.PolygonMeshBuilder("heatmapPoly", polyCorners, this._scene, earcut.default);
        this.deckMesh = deck.build();
        this.deckMesh.position = new BABYLON.Vector3(bridgeMesh.position.x - deckXoffset, bridgeMesh.position.y - deckYoffset, bridgeMesh.position.z - deckZoffset);
        this.deckMesh.renderingGroupId = 2;           
        this.deckMesh.rotation = new BABYLON.Vector3(0, 14 * (Math.PI/180), 0);
    }

    private _createSensors(){
        var sensorMaterial = new BABYLON.StandardMaterial("sensorMaterial", this._scene);
        sensorMaterial.diffuseColor = new BABYLON.Color3(1, 20/255, 147/255);

        window.store.sensors.forEach((sensor: SensorInfo) => {
            var sensorMesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateSphere(sensor.name, { diameter: 5 }, this._scene);

            sensorMesh.position = new BABYLON.Vector3(sensor.position.x, sensor.position.y, sensor.position.z);
            sensorMesh.material = sensorMaterial;
            sensorMesh.renderingGroupId = 2;
            //sensorMesh.showBoundingBox = true;
            this.sensorsMeshes.push(sensorMesh);
        });
    }

    private _createLights(){
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this._scene);
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
        skybox.material = skyboxMaterial;
    }
}