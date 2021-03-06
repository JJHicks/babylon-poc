"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
require("@babylonjs/core/Debug/debugLayer");
require("@babylonjs/inspector");
require("@babylonjs/loaders/glTF");
const BABYLON = __importStar(require("babylonjs"));
require("babylonjs-loaders");
const earcut = __importStar(require("earcut"));
window.earcut = earcut;
class Environment {
    _scene;
    _bridgeMeshes;
    _sensorLabels;
    deckMesh;
    sensorsMeshes;
    sensorLabelsVisible;
    constructor(scene) {
        this.sensorsMeshes = [];
        this._sensorLabels = [];
        this._scene = scene;
    }
    async load() {
        await this._loadAssets();
    }
    setAllSensorsVisible(visible) {
        const group = visible ? 3 : 2;
        this.sensorsMeshes.forEach(s => {
            s.renderingGroupId = group;
        });
    }
    updateSensorLabels(data) {
        const titleFont = "bold 32px monospace";
        const dataFont = "bold 24px monospace";
        function randstr() {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for (var i = 0; i < 8; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        }
        if (this._sensorLabels.length > 0) {
            this._sensorLabels.forEach((sensor) => {
                console.log(sensor);
                sensor.material.dispose(true, true, null);
                let labelTexture = new BABYLON.DynamicTexture("dynamic texture", { width: 512, height: 256 }, this._scene, false);
                // let labelTexture = new BABYLON.DynamicTexture("dynamic texture", {width:256, height:128}, this._scene, false);    
                // Change clearColor argument for background color, or set "transparent"
                labelTexture.drawText(sensor.name, null, null, titleFont, "white", "transparent", true, true);
                labelTexture.drawText(randstr(), null, 160, dataFont, "white", "transparent", true, true);
                let labelMaterial = new BABYLON.StandardMaterial("labelMaterial", this._scene);
                labelMaterial.emissiveColor = new BABYLON.Color3(255, 255, 255);
                labelMaterial.diffuseTexture = labelTexture;
                labelMaterial.diffuseTexture.hasAlpha = true;
                sensor.material = labelMaterial;
            });
            return;
        }
        this.clearSensorLabels();
        window.store.sensors.forEach((sensor) => {
            const sensorData = data.find((d) => d.id === sensor.id);
            const readingValue = sensorData !== undefined ? sensorData.value : "No Value";
            const text = sensor.name;
            let labelTexture = new BABYLON.DynamicTexture("dynamic texture", { width: 512, height: 256 }, this._scene, false);
            // let labelTexture = new BABYLON.DynamicTexture("dynamic texture", {width:128, height:128}, this._scene, false);  
            // Change clearColor argument for background color, or set "transparent"
            labelTexture.drawText(text, null, null, titleFont, "white", "transparent", true, true);
            labelTexture.drawText(readingValue, null, 160, dataFont, "white", "transparent", true, true);
            // labelTexture.drawText(readingValue, null, 100, dataFont, "white", "transparent", true, true);
            let labelMaterial = new BABYLON.StandardMaterial("labelMaterial", this._scene);
            labelMaterial.emissiveColor = new BABYLON.Color3(255, 255, 255);
            labelMaterial.diffuseTexture = labelTexture;
            labelMaterial.diffuseTexture.hasAlpha = true;
            const labelWidth = this._measureTextWidth(text, titleFont) + 10;
            const labelHeight = 200;
            //const labelHeight = 128;
            let label = BABYLON.MeshBuilder.CreatePlane(`label_${sensor.id}`, { width: labelWidth, height: labelHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, this._scene);
            label.renderingGroupId = 3;
            label.position = new BABYLON.Vector3(sensor.position.x, sensor.position.y + 50, sensor.position.z);
            label.material = labelMaterial;
            label.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
            this._sensorLabels.push(label);
        });
        this.sensorLabelsVisible = true;
    }
    _measureTextWidth(text, font) {
        var temp = new BABYLON.DynamicTexture("TempDynamicTexture", { width: 512, height: 256 }, this._scene, false);
        var tmpctx = temp.getContext();
        tmpctx.font = font;
        var DTWidth = tmpctx.measureText(text).width;
        temp.dispose();
        return DTWidth;
    }
    clearSensorLabels() {
        this._sensorLabels.forEach((label) => {
            label.dispose(null, true);
        });
        this._sensorLabels = [];
        this.sensorLabelsVisible = false;
    }
    async _loadAssets() {
        this._createSkyBox();
        this._createLights();
        await this._createTerrain();
        await this._createBridge();
        this._createSensors();
        this._createHeatmapPlane();
    }
    async _createBridge() {
        const bridgeImport = await BABYLON.SceneLoader.ImportMeshAsync(null, "../models/McFarlandBridge/", "McFarland Bridge.gltf", this._scene, e => console.log("Loading Bridge..." + Math.trunc((e.loaded / e.total) * 100) + "%"));
        var bridgeMaterial = new BABYLON.StandardMaterial("bridgeSurface", this._scene);
        bridgeMaterial.diffuseColor = new BABYLON.Color3(.617, .105, .195);
        bridgeImport.meshes.forEach(m => {
            m.receiveShadows = true;
            m.checkCollisions = true;
            m.renderingGroupId = 2;
        });
        bridgeMaterial.freeze();
        bridgeImport.meshes[1].material = bridgeMaterial;
        this._bridgeMeshes = bridgeImport.meshes;
        var bridgeMesh = bridgeImport.meshes[0];
        bridgeMesh.scaling.copyFromFloats(0.3, 0.3, 0.3);
        bridgeMesh.rotation = new BABYLON.Vector3(0, 1.462586, 0);
        bridgeMesh.position = new BABYLON.Vector3(-80, -50, 105);
    }
    async _createTerrain() {
        const terrainImport = await BABYLON.SceneLoader.ImportMeshAsync(null, "../models/scene/terrain/", "BridgeTerrainBuildings.gltf", this._scene, e => console.log("Loading Scene..." + Math.trunc((e.loaded / e.total) * 100) + "%"));
        var sceneMaterial = new BABYLON.StandardMaterial("scene", this._scene);
        sceneMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
        var sceneMesh = terrainImport.meshes[0];
        sceneMesh.scaling.copyFromFloats(12, 12, 12);
        terrainImport.meshes.forEach(mesh => {
            mesh.renderingGroupId = 2;
        });
        sceneMaterial.freeze();
        sceneMesh.material = sceneMaterial;
        sceneMesh.freezeWorldMatrix();
    }
    _createHeatmapPlane() {
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
        const deckZoffset = 90;
        const staticDeck = new BABYLON.PolygonMeshBuilder("heatmapPoly", polyCorners, this._scene, earcut.default);
        this.deckMesh = staticDeck.build();
        this.deckMesh.position = new BABYLON.Vector3(bridgeMesh.position.x - deckXoffset, bridgeMesh.position.y - deckYoffset, bridgeMesh.position.z - deckZoffset);
        this.deckMesh.renderingGroupId = 2;
        this.deckMesh.rotation = new BABYLON.Vector3(0, 14 * (Math.PI / 180), 0);
        const deck = new BABYLON.PolygonMeshBuilder("heatmapPoly", polyCorners, this._scene, earcut.default);
        this.deckMesh = deck.build();
        this.deckMesh.position = new BABYLON.Vector3(bridgeMesh.position.x - deckXoffset, bridgeMesh.position.y - deckYoffset, bridgeMesh.position.z - deckZoffset);
        this.deckMesh.renderingGroupId = 2;
        this.deckMesh.rotation = new BABYLON.Vector3(0, 14 * (Math.PI / 180), 0);
        this.deckMesh.freezeWorldMatrix();
    }
    _createSensors() {
        var sensorMaterial = new BABYLON.StandardMaterial("sensorMaterial", this._scene);
        sensorMaterial.diffuseColor = new BABYLON.Color3(1, 20 / 255, 147 / 255);
        sensorMaterial.freeze();
        window.store.sensors.forEach((sensor) => {
            var sensorMesh = BABYLON.MeshBuilder.CreateSphere(sensor.name, { diameter: 5 }, this._scene);
            sensorMesh.position = new BABYLON.Vector3(sensor.position.x, sensor.position.y, sensor.position.z);
            sensorMesh.material = sensorMaterial;
            sensorMesh.renderingGroupId = 2;
            //sensorMesh.showBoundingBox = true;
            sensorMesh.freezeWorldMatrix();
            this.sensorsMeshes.push(sensorMesh);
        });
    }
    _createLights() {
        var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this._scene);
    }
    _createSkyBox() {
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, this._scene);
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
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map