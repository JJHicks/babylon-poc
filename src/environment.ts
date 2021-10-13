import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import * as earcut from 'earcut';
(window as any).earcut = earcut;

export class Environment{

    private _scene: BABYLON.Scene;
    private _bridgeMeshes: BABYLON.AbstractMesh[];
    private _deckMesh: BABYLON.Mesh;

    public sensorsMeshes: BABYLON.Mesh[];

    constructor(scene: BABYLON.Scene) {
        this.sensorsMeshes = [];
        this._scene = scene;       
    }

    public getBridgePosition(){

    }

    public async load() {
        await this._loadAssets();
    }

    public adjustBridgeAlpha(){
        const alphaValue = parseFloat((document.getElementById("bridgeOpacity") as HTMLInputElement).value);
        this._bridgeMeshes.forEach(mesh => {
            mesh.visibility = alphaValue;
        });
        this._deckMesh.visibility = alphaValue;
    }
    
    private async _loadAssets() {
        this._createSkyBox();
        this._createLights();
        await this._createTerrain();
        await this._createBridge();
        this._createDeckPlane();        
    }

    private async _createBridge(){
        const bridgeImport = await BABYLON.SceneLoader.ImportMeshAsync(null, "../models/McFarlandBridge/", "McFarland Bridge.gltf", this._scene,
        e => console.info("Loading Bridge..." + Math.trunc((e.loaded / e.total) * 100) + "%"));

        let bridgeMaterial = new BABYLON.StandardMaterial("bridgeSurface", this._scene);
        bridgeMaterial.diffuseColor = new BABYLON.Color3(.617, .105, .195);

        bridgeImport.meshes.forEach(m => {
            m.receiveShadows = true;
            m.checkCollisions = true;
            m.renderingGroupId = 2;
        });

        bridgeMaterial.freeze();
        bridgeMaterial.backFaceCulling = true;
        bridgeImport.meshes[1].material = bridgeMaterial;

        this._bridgeMeshes = bridgeImport.meshes;

        let bridgeMesh = bridgeImport.meshes[0] as BABYLON.Mesh;
        bridgeMesh.scaling.copyFromFloats(0.3, 0.3, 0.3);
        
        bridgeMesh.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(83.8), 0);
        bridgeMesh.position = new BABYLON.Vector3(-80, -50, 105);
    }

    private async _createTerrain(){
        const terrainImport = await BABYLON.SceneLoader.ImportMeshAsync(null, "../models/scene/terrain/", "BridgeTerrainBuildings.gltf", this._scene,
        e => console.info("Loading Scene..." + Math.trunc((e.loaded / e.total) * 100) + "%"));

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
    
    private _createDeckPlane(){

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

        const staticDeck = new BABYLON.PolygonMeshBuilder("deckBasePoly", polyCorners, this._scene, earcut.default);
        this._deckMesh = staticDeck.build();
        this._deckMesh.position = new BABYLON.Vector3(bridgeMesh.position.x - deckXoffset, bridgeMesh.position.y - deckYoffset, bridgeMesh.position.z - deckZoffset);
        this._deckMesh.renderingGroupId = 2;
        this._deckMesh.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(14), 0);

        let deckMaterial = new BABYLON.StandardMaterial("baseDeckMaterial", this._scene);
        deckMaterial.backFaceCulling = true;
        this._deckMesh.material = deckMaterial;
        this._deckMesh.freezeWorldMatrix();
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